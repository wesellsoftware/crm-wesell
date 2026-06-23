'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTransaction, createRecurrence, createInstallments, updateTransaction } from '@/app/actions/financeiro'
import type { FinCategory, FinTransaction, FinTransactionType, SelectOption } from '@/lib/financeiro/types'
import type { InstallmentDraft } from '@/lib/financeiro/installments'
import { FinInstallmentsEditor } from './fin-installments-editor'
import { DEFAULT_BANK_NAME } from '@/lib/financeiro/banks'
import { FIN_PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/lib/financeiro/payment-methods'
import { cn } from '@/lib/utils'
import { finInputCls, finSelectCls, finToggleGroupCls, finToggleBtnCls, finToggleInactiveCls, finToggleActiveNatureCls, finFieldLabelCls } from './fin-input-styles'

function CategorySelect({
  name,
  defaultValue,
  options,
  placeholder,
}: {
  name: string
  defaultValue: string
  options: SelectOption[]
  placeholder: string
}) {
  const [value, setValue] = useState(defaultValue)
  const items = options.map(o => ({ value: o.id, label: o.name }))

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select
        value={value || null}
        onValueChange={v => setValue(v ?? '')}
        items={items}
      >
        <SelectTrigger className={cn('w-full h-8', finSelectCls)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.id} value={o.id} label={o.name}>{o.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

function PaymentMethodSelect({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  const items = [
    { value: '', label: 'Não informado' },
    ...FIN_PAYMENT_METHODS.map(method => ({
      value: method,
      label: PAYMENT_METHOD_LABELS[method],
    })),
  ]

  return (
    <>
      <input type="hidden" name="payment_method" value={value} />
      <Select
        value={value || null}
        onValueChange={v => setValue(v ?? '')}
        items={items}
      >
        <SelectTrigger className={cn('w-full h-8', finSelectCls)}>
          <SelectValue placeholder="Selecionar forma de pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Não informado</SelectItem>
          {FIN_PAYMENT_METHODS.map(method => (
            <SelectItem key={method} value={method} label={PAYMENT_METHOD_LABELS[method]}>
              {PAYMENT_METHOD_LABELS[method]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

type Mode = 'create' | 'edit'

type Props = {
  open: boolean
  onClose: () => void
  defaultType: FinTransactionType
  categories: FinCategory[]
  banks: SelectOption[]
  clients: SelectOption[]
  transaction?: FinTransaction
}

const EMPTY_STATE = { error: undefined as string | undefined, success: false }

type FormBodyProps = {
  categories: FinCategory[]
  banks: SelectOption[]
  clients: SelectOption[]
  transaction?: FinTransaction
  type: FinTransactionType
  setType: (t: FinTransactionType) => void
  natureMode: 'pontual' | 'parcelado' | 'recorrente'
  setNatureMode: (v: 'pontual' | 'parcelado' | 'recorrente') => void
  keepOpen: boolean
  setKeepOpen: (v: boolean) => void
  onClose: () => void
  onSuccess: (keepOpen: boolean) => void
}

function FinTransactionFormBody({
  categories,
  banks,
  clients,
  transaction,
  type,
  setType,
  natureMode,
  setNatureMode,
  keepOpen,
  setKeepOpen,
  onClose,
  onSuccess,
}: FormBodyProps) {
  const router = useRouter()
  const mode: Mode = transaction ? 'edit' : 'create'
  const isEdit = mode === 'edit'
  const isRecorrente = natureMode === 'recorrente'
  const isParcelado = natureMode === 'parcelado'

  const action = isEdit
    ? updateTransaction
    : isRecorrente
    ? createRecurrence
    : isParcelado
    ? createInstallments
    : createTransaction

  const [state, formAction, pending] = useActionState(
    action as (prev: typeof EMPTY_STATE, fd: FormData) => Promise<typeof EMPTY_STATE>,
    EMPTY_STATE,
  )

  useEffect(() => {
    if (!state?.success) return
    router.refresh()
    if (!isEdit && keepOpen) {
      onSuccess(true)
    } else {
      onSuccess(false)
    }
  }, [state, isEdit, keepOpen, onSuccess, router])

  const filteredCategories = categories.filter(c => c.type === type)
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7)
  const defaultBankId =
    transaction?.account_id
    ?? banks.find(b => b.name === DEFAULT_BANK_NAME)?.id
    ?? banks[0]?.id
    ?? ''
  const [isInternational, setIsInternational] = useState(
    transaction?.is_international_purchase ?? false,
  )
  const [amount, setAmount] = useState(String(transaction?.amount ?? ''))
  const [dueDate, setDueDate] = useState(transaction?.due_date ?? today)
  const [installmentCount, setInstallmentCount] = useState(2)
  const [installments, setInstallments] = useState<InstallmentDraft[]>([])
  const [installmentsValid, setInstallmentsValid] = useState(false)

  const parsedAmount = parseFloat(amount.replace(',', '.'))
  const canSubmitParcelado = isParcelado && !isNaN(parsedAmount) && parsedAmount > 0 && installmentsValid

  useEffect(() => {
    setIsInternational(transaction?.is_international_purchase ?? false)
  }, [transaction?.is_international_purchase, transaction?.id])

  useEffect(() => {
    setAmount(String(transaction?.amount ?? ''))
    setDueDate(transaction?.due_date ?? today)
  }, [transaction?.amount, transaction?.due_date, transaction?.id, today])

  return (
    <>
      <SheetHeader className="pb-4 border-b border-white/[0.07]">
        <SheetTitle className="text-we-paper">
          {isEdit ? 'Editar lançamento' : type === 'receita' ? 'Nova receita' : 'Nova despesa'}
        </SheetTitle>
      </SheetHeader>

      <form action={formAction} className="flex flex-col gap-5 p-4">
        {isEdit && <input type="hidden" name="id" value={transaction!.id} />}
        <input type="hidden" name="type" value={type} />

        {/* Type toggle (create only) */}
        {!isEdit && (
          <div className={finToggleGroupCls}>
            {(['receita', 'despesa'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  finToggleBtnCls,
                  type === t
                    ? t === 'receita'
                      ? 'bg-emerald-500/25 text-emerald-300 font-medium'
                      : 'bg-red-500/25 text-red-300 font-medium'
                    : finToggleInactiveCls,
                )}
              >
                {t === 'receita' ? 'Receita' : 'Despesa'}
              </button>
            ))}
          </div>
        )}

        {/* Nature toggle (create only) */}
        {!isEdit && (
          <div>
            <Label className={cn(finFieldLabelCls, 'mb-2 block')}>Natureza</Label>
            <div className={finToggleGroupCls}>
              {(['pontual', 'parcelado', 'recorrente'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setNatureMode(mode)}
                  className={cn(
                    finToggleBtnCls,
                    natureMode === mode
                      ? finToggleActiveNatureCls
                      : finToggleInactiveCls,
                  )}
                >
                  {mode === 'pontual' ? 'Pontual' : mode === 'parcelado' ? 'Parcelado' : 'Recorrente'}
                </button>
              ))}
            </div>
            {isRecorrente && (
              <p className="text-xs text-we-paper/50 mt-2">
                Gera automaticamente os próximos 12 meses.
              </p>
            )}
            {isParcelado && (
              <p className="text-xs text-we-paper/50 mt-2">
                Cria uma parcela por vencimento. Você pode ajustar o valor de cada uma.
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-we-paper/60 text-xs">Descrição *</Label>
          <Input
            id="description"
            name="description"
            placeholder={type === 'receita' ? 'Ex: Licença cliente XYZ' : 'Ex: Ferramentas SaaS'}
            defaultValue={transaction?.description}
            required
            className={finInputCls}
          />
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-we-paper/60 text-xs">
            {isParcelado ? 'Valor total (R$) *' : 'Valor (R$) *'}
          </Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            className={finInputCls}
          />
        </div>

        {isParcelado && !isEdit && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="installment_count" className="text-we-paper/60 text-xs">
                Número de parcelas *
              </Label>
              <Input
                id="installment_count"
                type="number"
                min="2"
                max="60"
                value={installmentCount}
                onChange={e => setInstallmentCount(Math.max(2, parseInt(e.target.value) || 2))}
                required
                className={finInputCls}
              />
            </div>
            <input type="hidden" name="installments" value={JSON.stringify(installments)} />
            <FinInstallmentsEditor
              totalAmount={parsedAmount}
              installmentCount={installmentCount}
              firstDueDate={dueDate}
              onInstallmentsChange={setInstallments}
              onValidChange={setInstallmentsValid}
            />
          </>
        )}

        {type === 'despesa' && (
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="is_international_purchase"
                checked={isInternational}
                onChange={e => setIsInternational(e.target.checked)}
                className="mt-0.5 accent-emerald-500"
              />
              <span className="text-xs text-we-paper/60 leading-snug">
                Compra internacional
              </span>
            </label>

            {isInternational && (
              <div className="space-y-1.5">
                <Label htmlFor="iof_amount" className="text-we-paper/60 text-xs">
                  Acréscimo IOF (R$) *
                </Label>
                <Input
                  id="iof_amount"
                  name="iof_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  defaultValue={transaction?.iof_amount ?? ''}
                  required
                  className={finInputCls}
                />
              </div>
            )}
          </div>
        )}

        {/* Date fields */}
        {!isRecorrente || isEdit ? (
          <div className="space-y-1.5">
            <Label htmlFor="due_date" className="text-we-paper/60 text-xs">
              {isParcelado ? 'Vencimento da 1ª parcela *' : 'Vencimento *'}
            </Label>
            <Input
              id="due_date"
              name="due_date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
              className={finInputCls}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="day_of_month" className="text-we-paper/60 text-xs">Dia do mês *</Label>
              <Input
                id="day_of_month"
                name="day_of_month"
                type="number"
                min="1"
                max="28"
                placeholder="1"
                required
                className={finInputCls}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start_month" className="text-we-paper/60 text-xs">A partir de *</Label>
              <Input
                id="start_month"
                name="start_month"
                type="month"
                defaultValue={currentMonth}
                required
                className={finInputCls}
              />
            </div>
          </div>
        )}

        {/* Paid date */}
        {(!isParcelado || isEdit) && (
          <div className="space-y-1.5">
            <Label htmlFor="paid_date" className="text-we-paper/60 text-xs">
              Data de {type === 'receita' ? 'recebimento' : 'pagamento'}{' '}
              <span className="text-we-paper/30">(opcional — marca como realizado)</span>
            </Label>
            <Input
              id="paid_date"
              name="paid_date"
              type="date"
              defaultValue={transaction?.paid_date ?? ''}
              className={finInputCls}
            />
          </div>
        )}

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-we-paper/60 text-xs">Categoria</Label>
          <CategorySelect
            name="category_id"
            defaultValue={transaction?.category_id ?? ''}
            options={filteredCategories.map(c => ({ id: c.id, name: c.name }))}
            placeholder="Selecionar categoria"
          />
        </div>

        {banks.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-we-paper/60 text-xs">Banco</Label>
            <CategorySelect
              name="account_id"
              defaultValue={defaultBankId}
              options={banks}
              placeholder="Selecionar banco"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-we-paper/60 text-xs">
            Forma de pagamento <span className="text-we-paper/30">(opcional)</span>
          </Label>
          <PaymentMethodSelect defaultValue={transaction?.payment_method ?? ''} />
        </div>

        {/* Client */}
        {clients.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-we-paper/60 text-xs">Cliente <span className="text-we-paper/30">(opcional)</span></Label>
            <CategorySelect
              name="client_id"
              defaultValue={transaction?.client_id ?? ''}
              options={clients}
              placeholder="Selecionar cliente"
            />
          </div>
        )}

        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}

        {!isEdit && (
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={keepOpen}
              onChange={e => setKeepOpen(e.target.checked)}
              className="mt-0.5 accent-emerald-500"
            />
            <span className="text-xs text-we-paper/60 leading-snug">
              Não fechar o drawer e cadastrar outro lançamento
            </span>
          </label>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={pending || (isParcelado && !isEdit && !canSubmitParcelado)}
            className="flex-1"
          >
            {pending ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </>
  )
}

export function FinTransactionDrawer({
  open,
  onClose,
  defaultType,
  categories,
  banks,
  clients,
  transaction,
}: Props) {
  const [formKey, setFormKey] = useState(0)
  const [type, setType] = useState<FinTransactionType>(transaction?.type ?? defaultType)
  const [natureMode, setNatureMode] = useState<'pontual' | 'parcelado' | 'recorrente'>(
    transaction?.nature === 'recorrente'
      ? 'recorrente'
      : transaction?.nature === 'parcelado'
      ? 'parcelado'
      : 'pontual',
  )
  const [keepOpen, setKeepOpen] = useState(false)

  function resolveNatureMode(tx?: FinTransaction): 'pontual' | 'parcelado' | 'recorrente' {
    if (tx?.nature === 'recorrente') return 'recorrente'
    if (tx?.nature === 'parcelado') return 'parcelado'
    return 'pontual'
  }

  // Reset form state when drawer opens (fixes stale success closing drawer immediately)
  useEffect(() => {
    if (open) {
      setFormKey(k => k + 1)
      setType(transaction?.type ?? defaultType)
      setNatureMode(resolveNatureMode(transaction))
      setKeepOpen(false)
    }
  }, [open, defaultType, transaction])

  const handleSuccess = useCallback((stayOpen: boolean) => {
    if (stayOpen) {
      setFormKey(k => k + 1)
    } else {
      onClose()
    }
  }, [onClose])

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md glass-dark overflow-y-auto">
        {open && (
          <FinTransactionFormBody
            key={formKey}
            categories={categories}
            banks={banks}
            clients={clients}
            transaction={transaction}
            type={type}
            setType={setType}
            natureMode={natureMode}
            setNatureMode={setNatureMode}
            keepOpen={keepOpen}
            setKeepOpen={setKeepOpen}
            onClose={onClose}
            onSuccess={handleSuccess}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
