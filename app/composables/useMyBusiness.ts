import type { Database, Customer } from '~/types/database.types'

/** Shared across the customer dashboard pages: the signed-in user's business(es). */
export function useMyBusiness() {
  const supabase = useSupabaseClient<Database>()

  const { data: customers, refresh } = useAsyncData('my-customers', async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    return (data ?? []) as Customer[]
  })

  const selectedId = useState<string>('my-selected-customer', () => '')

  watchEffect(() => {
    if (!selectedId.value && customers.value?.length) {
      selectedId.value = customers.value[0]!.id
    }
  })

  const customer = computed<Customer | null>(() =>
    customers.value?.find(c => c.id === selectedId.value) ?? customers.value?.[0] ?? null,
  )

  return { customers, customer, selectedId, refresh }
}
