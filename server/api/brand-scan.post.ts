import { z } from 'zod'
import { scanBrandColors } from '../utils/brandColors'

// Pre-auth by design: the signup flow calls this before the user has an
// account (step 2 → 3). scanBrandColors validates the URL strictly (no IP
// literals/localhost, size + subrequest caps) and returns colors only.
const bodySchema = z.object({ url: z.string().min(4).max(300) })

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  return await scanBrandColors(body.url)
})
