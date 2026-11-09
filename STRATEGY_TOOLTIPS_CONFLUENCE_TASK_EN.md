# Strategy tooltips: shared catalog, endpoint, and UI placement

**Status:** Ready to paste into Confluence. This page is a task specification; it has not been published.

## Goal

Provide one reusable English tooltip catalog for Strategy and display the approved explanations at the relevant fields in Stages 1–5. Reuse descriptions across stages and blocks. Update an existing tooltip in place when one is already present.

## Inputs to attach or link

1. Attach `STRATEGY_TOOLTIPS_DEVELOPER_GUIDE_EN.md`. It contains the exact field placement map, exact English copy, screenshot page references, and the JSON contract.
2. Attach `Strategy block screenshots.pdf` to help locate each block in the mock.
3. Link the [Strategy tooltip inventory](https://docs.google.com/spreadsheets/d/1OLhz8_l9vuo2di6535hpf15-pUXoWz5ZJ5X4XAQ_9Mg/edit?gid=849843283#gid=849843283). The English implementation guide applies three corrections to the 7 November snapshot: exclude `mini_backtest`; reuse `strategy.hit_rate` for the former `strategy.hr_val` placement; reuse `strategy.profit_factor.2` for the former `strategy.pf` placement. If the sheet differs, use the corrections in the attached guide for this task.

## Scope

- Object: `strategy`.
- 164 tooltip placements in 20 blocks, backed by 123 shared definitions.
- Stages 1–4: Hyperoptimization Parameters; Favorite Epochs; Post-processing formula info (Stability and Score); Source epoch info; Stage 4 Stoplosses and Loss streak & cooldown.
- Stage 5: Backtest parameters and Core metrics; Backtesting info (Performance, Temporal, Trades); Run Shuffler and Shuffler run parameters; Shuffle info Summary (General, Recovery); Synthetic Core metrics and Synthetic backtest info (Performance, Temporal metrics).
- Existing Backtesting, Shuffler, and Synthetic tooltips are in scope for a content check. They should be updated in place. The field placement map is a target-state inventory, not a list of missing tooltips.
- Excluded: `mini_backtest`, unlisted section headings, Shuffle charts, Synthetic Fees, and the previously removed Strategy and Builder blocks. Keep unrelated action, status, error, and chart interaction tooltips.

## Implementation requirements

1. Use `block.key` + `field.key` to identify a placement. Use `fields[].stages` for applicability; do not copy a shared block for every stage. In particular, `hyperopt_parameters` is one block for Stages 1–4.
2. Keep each description under one `tooltip_key`. One description may serve multiple placements when the meaning and calculation match. Do not merge metrics solely because their visible labels match.
3. Use one `description` string for the full tooltip, including any `Calculation:` text, line breaks, and emphasis. Do not create a separate `formula` property.
4. Render only one explanatory tooltip trigger per field. Support mouse hover and keyboard focus. Tooltips in modals and tables must remain readable and visible above surrounding layers.
5. Match fields against the current UI. If a field is absent or has a different meaning, list it in the implementation report rather than creating a new input or metric to host a tooltip.
6. In the mock, reuse the current Radix/shadcn tooltip components and existing Backtesting tooltip behavior. Where a backend is available, the UI should resolve text through the shared endpoint contract. Until then, the mock can use a local catalog with the same keys and descriptions.

## Read-only endpoint contract

Expose a read-only tooltip endpoint using the backend's existing route conventions. `GET /api/tooltips?object=strategy` is a suggested path, not an existing route. The required response shape is:

```json
{
  "objects": [
    {
      "key": "strategy",
      "blocks": [
        {
          "key": "backtest_core_metrics",
          "fields": [
            {
              "key": "profit_factor",
              "stages": [5],
              "tooltip_key": "strategy.profit_factor.2"
            }
          ]
        },
        {
          "key": "shuffle_info.summary.general",
          "fields": [
            {
              "key": "pf",
              "stages": [5],
              "tooltip_key": "strategy.profit_factor.2"
            }
          ]
        }
      ],
      "tooltips": {
        "strategy.profit_factor.2": {
          "description": "Gross profit divided by the absolute value of gross loss."
        }
      }
    }
  ]
}
```

`objects` and `blocks` are arrays so the response can later include several system objects and several blocks per object. Every referenced `tooltip_key` must exist in that object's `tooltips` map. Return each definition once; omit unused definitions. `objects[].key`, `blocks[].key`, and each field key within its block must be unique. Descriptions are always English, so the response has no `locale` or `revision`. Visible UI labels and screenshot links do not belong in the JSON.

## Acceptance criteria

- Every one of the 164 placements in the attached English guide is implemented or explicitly reported as unmatched with a reason.
- An existing tooltip is updated rather than duplicated; one field has at most one explanatory trigger.
- The same `tooltip_key` displays the same description everywhere, including cross-stage and cross-block reuse.
- `mini_backtest` is absent from the new catalog and placement map.
- The endpoint follows the JSON contract above: no dangling references, unused descriptions, `locale`, `revision`, or separate `formula` field.
- `Calculation:` content remains inside `description`; paragraphs and emphasis display correctly.
- Hover, keyboard focus, modal layering, and table layout are checked in representative locations. The mock builds with `npm run build`, and representative placements are reviewed in both UI themes.

## Delivery notes

Report which existing tooltips were reused or updated, which placements were newly added, and which listed fields could not be matched in the current UI. Attach the endpoint response example or contract check result when the backend part is implemented.
