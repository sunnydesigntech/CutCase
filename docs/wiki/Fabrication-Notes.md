# Fabrication Notes

CutCase generates SVG geometry for fabrication, but physical fit depends on the machine and material.

## Measure Material

Use calipers and enter the actual sheet thickness. Nominal thickness is often different from measured thickness.

## Kerf

Kerf is the width removed by the laser. It varies with:

- material
- thickness
- focus
- power
- speed
- lens
- air assist
- machine condition

CutCase provides loose, standard, and tight fit modes as quick kerf multipliers.

## Fit Test

Before cutting a full design:

1. Export the fit-test coupon.
2. Cut it from the same material.
3. Test loose, standard, and tight pairs.
4. Adjust kerf or fit mode.
5. Cut the final box only after the fit is acceptable.

## Lid Clearance

For lift-off lids, start with a small clearance such as `0.3 mm`. Increase clearance if the lid is too tight.

## Divider Slots

Divider interlock slots are generated from material thickness plus effective kerf. If divider joints are too tight, increase kerf, use a looser fit mode, or disable slots and manually adjust the design.

## Current Limitations

- no DXF export yet
- no automatic sheet packing
- no dogbone reliefs yet
- no full polygon-offset kerf engine yet
- no saved material preset library yet
