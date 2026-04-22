import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxHeight?: number
}

function setTextareaHeight(element: HTMLTextAreaElement, maxHeight: number) {
  element.style.height = 'auto'
  const nextHeight = Math.min(element.scrollHeight, maxHeight)
  element.style.height = `${nextHeight}px`
  element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden'
}

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(function AutoResizeTextarea(
  { maxHeight = 224, onChange, style, ...props },
  forwardedRef,
) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null)

  useImperativeHandle(forwardedRef, () => internalRef.current as HTMLTextAreaElement, [])

  const resize = useCallback(() => {
    if (!internalRef.current) return
    setTextareaHeight(internalRef.current, maxHeight)
  }, [maxHeight])

  useEffect(() => {
    resize()
  }, [resize, props.value])

  return (
    <textarea
      {...props}
      ref={internalRef}
      onChange={(event) => {
        setTextareaHeight(event.currentTarget, maxHeight)
        onChange?.(event)
      }}
      style={{
        ...style,
        maxHeight: `${maxHeight}px`,
      }}
    />
  )
})

export default AutoResizeTextarea
