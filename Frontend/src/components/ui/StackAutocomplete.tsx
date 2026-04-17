import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import {
  STACK_OPTIONS,
  getStackOptionsByCategory,
  normalizeStackValues,
  resolveStackOption,
  toStackDisplayLabel,
  type StackCategoryKey,
} from '@/data/stackCatalog'
import StackBadge from '@/components/ui/StackBadge'

export default function StackAutocomplete({
  value,
  onChange,
  placeholder,
  category,
  allowCustom = true,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  category?: StackCategoryKey
  allowCustom?: boolean
}) {
  const options = (category ? getStackOptionsByCategory(category) : STACK_OPTIONS).map((option) => option.label)

  return (
    <Autocomplete
      multiple
      freeSolo={allowCustom}
      options={options}
      value={value}
      onChange={(_, nextValue) => {
        const normalized = normalizeStackValues(nextValue
          .map((item) => toStackDisplayLabel(typeof item === 'string' ? item : String(item)))
          .filter(Boolean))

        onChange(normalized)
      }}
      filterSelectedOptions
      autoHighlight
      clearOnBlur={false}
      popupIcon={null}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg,rgba(19,22,30,0.98),rgba(13,15,20,0.98))',
            boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
            color: 'rgba(255,255,255,0.88)',
            overflow: 'hidden',
          },
        },
        popper: {
          sx: {
            '& .MuiAutocomplete-listbox': {
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            },
            '& .MuiAutocomplete-option': {
              minHeight: 'unset',
              borderRadius: '12px',
              px: 1.5,
              py: 1.25,
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.72)',
              '&[aria-selected="true"]': {
                backgroundColor: 'rgba(99,102,241,0.14)',
                color: 'rgba(255,255,255,0.94)',
              },
              '&.Mui-focused': {
                backgroundColor: 'rgba(255,255,255,0.05)',
              },
              '&[aria-selected="true"].Mui-focused': {
                backgroundColor: 'rgba(99,102,241,0.18)',
              },
            },
          },
        },
        clearIndicator: {
          sx: {
            color: 'rgba(255,255,255,0.34)',
            '&:hover': { color: 'rgba(255,255,255,0.72)' },
          },
        },
      }}
      renderValue={(selected, getItemProps) =>
        selected.map((option, index) => {
          const stringValue = typeof option === 'string' ? option : String(option)
          const { key, onDelete, className, ...tagProps } = getItemProps({ index })
          return (
            <div
              key={key ?? `${stringValue}-${index}`}
              className={[className, 'mr-1 mt-1 inline-flex items-center gap-1 rounded-full'].filter(Boolean).join(' ')}
              {...tagProps}
            >
              <StackBadge value={stringValue} compact />
              <button
                type="button"
                onClick={onDelete}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/6 text-[10px] text-white/46 transition-[border-color,color,background-color] duration-150 hover:border-white/18 hover:bg-white/10 hover:text-white/78"
                aria-label={`Remover ${stringValue}`}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })
      }
      renderOption={(props, option) => {
        const stack = resolveStackOption(option)
        return (
          <li {...props}>
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: stack.accentColor }}
                aria-hidden="true"
              />
              <span>{stack.label}</span>
            </div>
          </li>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              alignItems: 'flex-start',
              minHeight: '44px',
              borderRadius: '18px',
              backgroundColor: 'rgba(13,15,20,0.88)',
              color: 'rgba(255,255,255,0.86)',
              px: '6px',
              py: '4px',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.08)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.14)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(99,102,241,0.38)',
                boxShadow: '0 0 0 3px rgba(99,102,241,0.12)',
              },
            },
            '& .MuiOutlinedInput-input': {
              color: 'rgba(255,255,255,0.86)',
              fontSize: '0.875rem',
              py: '9px',
            },
            '& .MuiOutlinedInput-input::placeholder': {
              color: 'rgba(255,255,255,0.24)',
              opacity: 1,
            },
          }}
        />
      )}
    />
  )
}
