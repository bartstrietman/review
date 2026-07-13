// Serves the embeddable widget loader: GET /widget/<slug>.js
// - data-mode="popup" (default): floating launcher → modal iframe of /r/<slug>
// - data-mode="embed" data-target="id": inline iframe inside that element
export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'slug') || ''
  const slug = raw.replace(/\.js$/, '').replace(/[^a-z0-9-]/gi, '')
  const origin = getRequestURL(event).origin

  setHeader(event, 'Content-Type', 'application/javascript; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=300')

  // Launcher button in the customer's brand colors (fall back to defaults if
  // the lookup fails — the widget must keep working regardless).
  let bg = '#0F3D2E'
  let fg = '#fff'
  const supaUrl = process.env.SUPABASE_URL
  const supaKey = process.env.SUPABASE_KEY
  if (slug && supaUrl && supaKey) {
    try {
      const rows = await $fetch<{ bg_color: string | null; text_color: string | null }[]>(
        `${supaUrl}/rest/v1/rpc/get_widget`,
        { method: 'POST', headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` }, body: { p_slug: slug } },
      )
      const w = rows?.[0]
      if (w?.bg_color && /^#[0-9a-f]{3,8}$/i.test(w.bg_color)) bg = w.bg_color
      if (w?.text_color && /^#[0-9a-f]{3,8}$/i.test(w.text_color)) fg = w.text_color
    }
    catch { /* keep defaults */ }
  }

  const S = JSON.stringify(slug)
  const O = JSON.stringify(origin)

  return `(function(){
  var SLUG=${S},ORIGIN=${O};
  var cur=document.currentScript;
  var mode=(cur&&cur.getAttribute('data-mode'))||'popup';
  var url=ORIGIN+'/r/'+SLUG;
  function frame(h){var f=document.createElement('iframe');f.src=url;f.title='Review';f.loading='lazy';f.style.cssText='border:0;width:100%;height:'+h+';background:transparent';return f;}
  if(mode==='embed'){
    var id=cur&&cur.getAttribute('data-target');var el=id&&document.getElementById(id);
    if(el){var f=frame('560px');f.style.borderRadius='16px';el.appendChild(f);}return;
  }
  var open=false;
  var btn=document.createElement('button');
  btn.type='button';btn.textContent='Laat een review achter';
  btn.style.cssText='position:fixed;right:20px;bottom:20px;z-index:2147483000;background:${bg};color:${fg};border:0;border-radius:999px;padding:12px 18px;font:600 14px Inter,system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.18);cursor:pointer';
  btn.onclick=function(){if(open)return;open=true;
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px';
    var box=document.createElement('div');box.style.cssText='position:relative;width:100%;max-width:440px';
    var x=document.createElement('button');x.type='button';x.setAttribute('aria-label','Sluiten');x.innerHTML='&times;';
    x.style.cssText='position:absolute;top:-38px;right:0;background:none;border:0;color:#fff;font-size:30px;line-height:1;cursor:pointer';
    function done(){if(ov.parentNode)document.body.removeChild(ov);open=false;}
    x.onclick=done;ov.onclick=function(e){if(e.target===ov)done();};
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){done();document.removeEventListener('keydown',esc);}});
    var f=frame('600px');f.style.borderRadius='20px';f.style.maxHeight='80vh';
    box.appendChild(x);box.appendChild(f);ov.appendChild(box);document.body.appendChild(ov);
  };
  if(document.body)document.body.appendChild(btn);
  else document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(btn);});
})();`
})
