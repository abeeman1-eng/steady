import { useNavigate } from 'react-router-dom'
import { backAction } from '../lib/navigation'

/**
 * The visible Back action every non-tab page must have. Goes back when there's an earlier page
 * in the app; otherwise goes to `parent` and says where ("‹ Food log"), so there's always a
 * working way home. See "Navigation requirements" in the README.
 */
export function BackButton({ parent, parentLabel, className = '' }: { parent: string; parentLabel: string; className?: string }) {
  const navigate = useNavigate()
  const action = backAction(window.history.state?.idx, parent)
  const label = action.kind === 'history' ? 'Back' : parentLabel
  return (
    <button
      type="button"
      onClick={() => (action.kind === 'history' ? navigate(-1) : navigate(action.to, { replace: true }))}
      className={`-ml-1 inline-flex min-h-11 items-center gap-1 px-1 text-[15px] font-medium text-accent ${className}`}
    >
      <span aria-hidden>‹</span> {label}
    </button>
  )
}
