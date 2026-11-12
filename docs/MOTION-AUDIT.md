# Motion audit (animation-master, November 2026)

Method: `audit_motion.py` over `src` (0 errors, 1 warning, 4 notes), then a manual sweep for what a script cannot see.
Gate used for every surface: frequency tier, then one named purpose (feedback, spatial, state, preventing a jarring change, delight).

## Changed in this pass
| Surface | Tier | Purpose | Change |
|---|---|---|---|
| All `transition-*` utilities | tens per day | feedback | Product curve and 160ms through `--default-transition-*` in `globals.css` |
| Checkbox | tens per day | feedback | Tick pops in, 180ms ease-out, from 0.85 scale |
| Input, Textarea, Select | tens per day | feedback | Border colour eases; focus ring instant (keyboard-driven) |
| Field error, error summary | occasional | state | Fade and 8px rise (`m-enter`) |
| Auth pages | occasional | preventing a jarring change | Title, lead and form stagger in |
| Status card | occasional | state | Cross-fade only when the state changes (`SwapOnChange`) |
| Notifications | occasional | preventing a jarring change | Stagger, capped at six |
| Install card | rare | state | Rises in; dismiss folds away, then unmounts |
| Daily log list | tens per day | state | New entry eases in; delete fades out first; failed delete restores |
| Member page change | tens per day | spatial | Reduced to a 160ms fade, no travel |
| Side rail | occasional | spatial | Width uses tokens |

## Rejected by the gate (deliberately not animated)
- **Sliding indicator on the side rail and admin tab strip.** Core navigation, used tens to hundreds of times a day; a colour change is enough.
- **Row-by-row table entrances, audit log, password and recovery-code screens.** Frequent or security-sensitive.
- **Keyboard-initiated actions.** None animate.

## Left as is, with reason
- `floating-nav.css:39` transitions `max-width` (audit warning). The active pill has to grow to fit its word and has no transform equivalent; five elements, 260ms.
- Infinite loops (ribbon stripes and ping, skeleton pulse, ring spinner) are paused off-screen or limited to opacity/transform, and stop under reduced motion.

## Not done
- **Queue rows collapsing after Approve/Decline.** The row disappears when the server refresh removes it. Animating that needs a hook into the refresh and cannot be checked without a running build; better done with a browser in front of you.
- **Avatar fade-in on image load.** Needs a client component for every avatar; low value.

## Feel-check (cannot be judged from code)
Slow animations to 10% in DevTools: checkbox tick, field error, status card swap, log add and delete. Check the log delete on a real phone, and the member-app page change at 4x CPU throttle.
