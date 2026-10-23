# Seal-set artwork release — 2026-10-23

Scope: publish 18 already-approved Adventure illustrations as public static images. No app code, product prices, stock, set membership, or service-poster change.

## Mapping

| Set ID | Artwork | SHA-256 |
| --- | --- | --- |
| seal-set-AT-1 | at-starter-agumon.png | 4e5ba4b333ebf2642f1037ce5ea589c44df9842a17b07b75429ce15c57bb7b18 |
| seal-set-HT-1 | ht-starter-gabumon.png | c49eea8f6a4c5400201aa8146cd96ba104f1b25e9355b3117171f64816b845a7 |
| seal-set-CT-1 | ct-starter-tentomon.png | 6e9ad7a3db141c79c8d5f713cea03727f9da34aa06d4225341239315703b96de |
| seal-set-HP-1 | hp-starter-biyomon.png | d80ff153ad00595ee813dca7298a186774b39cb66efbbde38ed5cc33b0698925 |
| seal-set-DS-1 | ds-starter-gomamon.png | 2ef910011d6991672f2212fbd0c49eeed4e64ebbb93c9e226a93a55551420512 |
| seal-set-DE-1 | de-starter-palmon.png | f97e435da934f3c075a0303edb341ccceeed9f8c9d70585f5a226935e29669a7 |
| seal-set-EV-1 | ev-starter-patamon.png | 7ad70e2758312716b9c7db300f7bb45bc30ff814257434bf63a05c9099b80930 |
| seal-set-BL-1 | bl-starter-gatomon.png | 7932d1f95e211276e0d6c02a79cf073d8fbab9a192a1bf51f353d542c6fee674 |
| seal-set-AT-3 | at-large-wargreymon.png | 12068cef5b4ae5756011acea0c97f773c3212598549d33da6bf971619a66072d |
| seal-set-HT-3 | ht-large-metalgarurumon.png | a170dd2f3935b4a5eda8eb0563a4ea095e80337950cf5b7df8a8a2ac86c6d624 |
| seal-set-CT-3 | ct-large-herculeskabuterimon.png | b403654b666bcc66729168f0deaabdec9b5ad6d22c1bd6e7b2b4975503752db2 |
| seal-set-HP-3 | hp-large-phoenixmon.png | 601d5e19c1ac1b190f8e8aa3dc8c6385a9f28d9b91919687e49a2e903fb685e0 |
| seal-set-DS-3 | ds-large-vikemon.png | f8ec65c4b3b62dc9aad98bfcf4fbc346884b3c3afd8ddffabff8aa84bcbb5f72 |
| seal-set-DE-3 | de-large-rosemon.png | 658548123029a3113180bdfea926e58f7c8af427e736bdc9ab034cda6c7ce1db |
| seal-set-EV-3 | ev-large-seraphimon.png | 3ccfc26150f6373b7bb481b622cf82cae8d7ad16ac577e7d1b2214d9caf6839a |
| seal-set-BL-3 | bl-large-holydramon.png | 154b846d9f95a13cac63a15d891c2af2b43a081090a7e88a35d2f91f851a5003 |
| seal-set-ALL-1 | all-starter-eight-partners.png | 0ec210a58e4fb8a782e1e888a6d13cce71323e1fe0e80a1b34131354899c93d2 |
| seal-set-ALL-3 | all-large-eight-megas.png | fbcd6e44683bb00ea373b84380fcee9aeee82e17e0f936ed4062da2dbd761161 |

All source images are 1254 × 1254 PNG. Original bytes preserved. Generated using built-in image_gen; source prompt set and original PNG pack retained in the workspace outputs directory. AI-created illustrations, not official artwork.

## Publication and recovery

- Publish asset manifest and files through the existing candidate release workflow, then verify every HTTPS image before editing Settings.
- Set only each matching set's image URL in the normal authenticated admin UI. Preserve member IDs, enabled flags, names, multipliers, and all other settings.
- Public settings snapshot and deployment mapping are retained locally in outputs/seal-set-art-before-20261023.json and outputs/seal-set-art-publish-map-20261023.json. Neither backup file belongs in the public build.
- Previous production commit: 8108fdc838ec6ec8ee5f3f481d73c1d6ff897f07. Retain backup/pre-seal-set-art-20261023 before publishing.
- Rollback: first restore the 18 previous image URLs through Settings (all were blank at snapshot), leaving every other value untouched; then, if needed, dispatch candidate release from the backup ref. Do not select the much older rollback-baseline package.
- No Google Apps Script deployment, live schema migration, credential change, or order/stock mutation required.
