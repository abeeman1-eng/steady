/**
 * Where a Back action should go. React Router records each in-app navigation's position as
 * `history.state.idx`; 0 means this page was the first one opened in the tab (a fresh launch
 * from the home screen, a shared link, or a reload). Going "back" from there would leave the
 * app, so the page's parent is used instead.
 */
export type BackAction = { kind: 'history' } | { kind: 'parent'; to: string }

export function backAction(historyIdx: number | undefined, parent: string): BackAction {
  return (historyIdx ?? 0) > 0 ? { kind: 'history' } : { kind: 'parent', to: parent }
}
