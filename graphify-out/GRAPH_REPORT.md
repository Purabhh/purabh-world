# Graph Report - .  (2026-09-14)

## Corpus Check
- 31 files · ~39,384 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 121 nodes · 198 edges · 15 communities detected
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `box()` - 12 edges
2. `buildEducation()` - 10 edges
3. `buildEssex()` - 10 edges
4. `buildProjectsDistrict()` - 10 edges
5. `registerInteractable()` - 9 edges
6. `buildAtmosphere()` - 9 edges
7. `injectStyles()` - 8 edges
8. `uiRoot()` - 8 edges
9. `patch()` - 8 edges
10. `tree()` - 8 edges

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
Nodes (15): buildAchievements(), addCircle(), buildEssex(), makeCylinderTex(), makeLogoTex(), makeRadial(), makeTickerTex(), addBuildingSign() (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (11): createCinematic(), createHUD(), createLanding(), escapeHtml(), createNudge(), createPanel(), injectStyles(), uiRoot() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.3
Nodes (13): buildEducation(), makeRutgersLogoTexture(), buildEnvironment(), makeRng(), buildProjectsDistrict(), box(), building(), groundSlab() (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (9): addBox(), colliders(), blockedAt(), buildPet(), clearAhead(), damp(), lerp(), makeHeart() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (6): buildAzonix(), makeSignTex(), buildBny(), makeBnyLogoTexture(), makeFacadeTex(), registerInteractable()

### Community 5 - "Community 5"
Cohesion: 0.52
Nodes (6): buildAtmosphere(), makeBird(), makeButterfly(), makeMoonDisc(), makeSoftDot(), makeSunDisc()

### Community 6 - "Community 6"
Cohesion: 0.4
Nodes (2): eyebrowFor(), triggerInteract()

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (5): cacheKey(), fetchRepos(), normalize(), readCache(), writeCache()

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (2): createEngine(), makeSkyTexture()

### Community 9 - "Community 9"
Cohesion: 0.67
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (2): buildTerrain(), mix()

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 11`** (2 nodes): `createPlayer()`, `player.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `buildLanterns()`, `lanterns.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `constants.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `resume.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `registerInteractable()` connect `Community 4` to `Community 0`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `buildProjectsDistrict()` connect `Community 2` to `Community 0`, `Community 9`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `box()` connect `Community 2` to `Community 3`, `Community 5`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `box()` (e.g. with `buildEducation()` and `buildProjectsDistrict()`) actually correct?**
  _`box()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `buildEducation()` (e.g. with `addBox()` and `patch()`) actually correct?**
  _`buildEducation()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `buildEssex()` (e.g. with `addCircle()` and `addFloatingLogo()`) actually correct?**
  _`buildEssex()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `buildProjectsDistrict()` (e.g. with `patch()` and `pillar()`) actually correct?**
  _`buildProjectsDistrict()` has 9 INFERRED edges - model-reasoned connections that need verification._