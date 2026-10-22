# Graph Report - .  (2026-10-22)

## Corpus Check
- 33 files · ~52,073 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 126 nodes · 206 edges · 17 communities detected
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `box()` - 12 edges
2. `buildProjectsDistrict()` - 10 edges
3. `registerInteractable()` - 9 edges
4. `buildAchievements()` - 9 edges
5. `buildEducation()` - 9 edges
6. `buildEssex()` - 9 edges
7. `injectStyles()` - 9 edges
8. `uiRoot()` - 9 edges
9. `buildAtmosphere()` - 9 edges
10. `buildLandmarks()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `makeTextTexture()` --calls--> `buildProjectsDistrict()`  [INFERRED]
  src\landmarks\floatingLogo.js → src\projects\projectsDistrict.js
- `addBuildingSign()` --calls--> `buildProjectsDistrict()`  [INFERRED]
  src\landmarks\floatingLogo.js → src\projects\projectsDistrict.js
- `addBox()` --calls--> `buildAzonix()`  [INFERRED]
  src\core\colliders.js → src\landmarks\azonix.js
- `addBox()` --calls--> `buildBny()`  [INFERRED]
  src\core\colliders.js → src\landmarks\bny.js
- `addBox()` --calls--> `buildEducation()`  [INFERRED]
  src\core\colliders.js → src\landmarks\education.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (12): createCinematic(), createHUD(), createLanding(), escapeHtml(), createNudge(), createPanel(), injectStyles(), uiRoot() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (15): buildAchievements(), buildBny(), makeBnyLogoTexture(), makeFacadeTex(), buildEssex(), makeCylinderTex(), makeLogoTex(), makeRadial() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (12): addBox(), addCircle(), colliders(), buildEnvironment(), makeRng(), blockedAt(), buildPet(), clearAhead() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.31
Nodes (13): buildAzonix(), makeSignTex(), buildEducation(), registerInteractable(), buildProjectsDistrict(), box(), building(), groundSlab() (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (7): cacheKey(), fetchRaw(), fetchRepos(), normalize(), pick(), readCache(), writeCache()

### Community 5 - "Community 5"
Cohesion: 0.33
Nodes (2): eyebrowFor(), triggerInteract()

### Community 6 - "Community 6"
Cohesion: 0.52
Nodes (6): buildAtmosphere(), makeBird(), makeButterfly(), makeMoonDisc(), makeSoftDot(), makeSunDisc()

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (2): hexA(), makeIcon()

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): createEngine(), makeSkyTexture()

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (2): buildTerrain(), mix()

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 12`** (2 nodes): `createPlayer()`, `player.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `buildLanterns()`, `lanterns.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `window-icon.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `constants.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `resume.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `registerInteractable()` connect `Community 3` to `Community 8`, `Community 1`, `Community 2`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `buildProjectsDistrict()` connect `Community 3` to `Community 1`, `Community 10`, `Community 4`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `buildAchievements()` connect `Community 1` to `Community 2`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `box()` (e.g. with `buildProjectsDistrict()` and `buildAtmosphere()`) actually correct?**
  _`box()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `buildProjectsDistrict()` (e.g. with `patch()` and `pillar()`) actually correct?**
  _`buildProjectsDistrict()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `registerInteractable()` (e.g. with `buildAchievements()` and `buildAzonix()`) actually correct?**
  _`registerInteractable()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `buildAchievements()` (e.g. with `addCircle()` and `patch()`) actually correct?**
  _`buildAchievements()` has 8 INFERRED edges - model-reasoned connections that need verification._