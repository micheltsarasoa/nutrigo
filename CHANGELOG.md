# Changelog

## [1.0.0](https://github.com/micheltsarasoa/nutrigo/compare/v0.4.0...v1.0.0) (2026-10-16)

Grocery list, costs and offline (SPEC-005), and the first release that meets every Must requirement for local use: generate the week's shopping list from the plan, tick items off in the shop (also offline), see what it costs, and follow your spending. The saved locale now sets how numbers and money are written everywhere.

### Features

* **web:** add the Groceries page at `/groceries/:isoWeek`: generate and regenerate the list, tick items, change quantities, enter the price paid, add your own items ([#259](https://github.com/micheltsarasoa/nutrigo/issues/259))
* **web:** add the Insights page at `/groceries/:isoWeek/insights`: weekly spend and a category breakdown, each with a table view ([#260](https://github.com/micheltsarasoa/nutrigo/issues/260))
* **web:** keep changes made offline in a queue and send them when the connection returns, with a banner for offline, syncing and error; the last list opens offline ([#261](https://github.com/micheltsarasoa/nutrigo/issues/261))
* **web:** add the GroceryTable and GroceryList organisms (desktop table, phone list grouped by category) ([#254](https://github.com/micheltsarasoa/nutrigo/issues/254)) ([#255](https://github.com/micheltsarasoa/nutrigo/issues/255))
* **web:** add the Donut, StackedBar, ChartTable and SpendChart organisms ([#256](https://github.com/micheltsarasoa/nutrigo/issues/256)) ([#257](https://github.com/micheltsarasoa/nutrigo/issues/257)) ([#258](https://github.com/micheltsarasoa/nutrigo/issues/258)) ([#260](https://github.com/micheltsarasoa/nutrigo/issues/260))
* **web:** add the KpiCard, OfflineBanner, Legend, GroceryRow and CheckRow molecules ([#251](https://github.com/micheltsarasoa/nutrigo/issues/251)) ([#252](https://github.com/micheltsarasoa/nutrigo/issues/252)) ([#253](https://github.com/micheltsarasoa/nutrigo/issues/253)) ([#249](https://github.com/micheltsarasoa/nutrigo/issues/249)) ([#250](https://github.com/micheltsarasoa/nutrigo/issues/250))
* **web:** add the MoneyField and Checkbox atoms ([#248](https://github.com/micheltsarasoa/nutrigo/issues/248)) ([#247](https://github.com/micheltsarasoa/nutrigo/issues/247))
* **web:** add a price per pack on the ingredient form ([#246](https://github.com/micheltsarasoa/nutrigo/issues/246))
* **api:** add the shopping-list routes (generate, read, add item, batch update, delete) and `GET /api/spending` ([#244](https://github.com/micheltsarasoa/nutrigo/issues/244)) ([#245](https://github.com/micheltsarasoa/nutrigo/issues/245))
* **api:** add the shopping-list tables and the ingredient price columns ([#243](https://github.com/micheltsarasoa/nutrigo/issues/243))
* **shared:** add `buildList`, `estimateCost`, `regenerate` and `resolveConflict` for the shopping list ([#242](https://github.com/micheltsarasoa/nutrigo/issues/242))

### Bug Fixes

* **web:** apply the saved locale (`fr-FR` or `en-IE`) to kcal and money on every page ([#294](https://github.com/micheltsarasoa/nutrigo/issues/294))
* **web:** heading order on the Targets page and the phone grocery list (found by the new axe pass over every route) ([#263](https://github.com/micheltsarasoa/nutrigo/issues/263))

### Tests

* **e2e:** cover SPEC-005 AC-1 to AC-11, offline cases included, and run axe over every route at 1280 and 390 px ([#262](https://github.com/micheltsarasoa/nutrigo/issues/262)) ([#263](https://github.com/micheltsarasoa/nutrigo/issues/263))

### Known gaps

* Total kcal on the grocery list shows "–": the list API returns no calories.
* The per-week category StackedBar is not on the Insights page: the spending API has no per-week split.
* The Playwright screenshot baselines for the new components and the grocery pages still have to be generated.
* Deployment to Railway (D-1 to D-4) is v1.1.0.

## [0.4.0](https://github.com/micheltsarasoa/nutrigo/compare/v0.3.0...v0.4.0) (2026-10-16)

Today screen (SPEC-004): tick meals as eaten, see kcal and macros against daily targets, and a week trend. The CIQUAL/OpenFoodFacts import moved to Sprint 6.

### Features

* **web:** add the Today page at `/`: tick meals as eaten (with custom servings), calories ring, macros and the week trend ([#219](https://github.com/micheltsarasoa/nutrigo/issues/219)) ([2e83b90](https://github.com/micheltsarasoa/nutrigo/commit/2e83b903ec085377b44a17b1b04e4ffac2416f84))
* **web:** add the Targets page at `/targets` to set daily kcal, carbs, protein and fat ([#220](https://github.com/micheltsarasoa/nutrigo/issues/220)) ([cca472a](https://github.com/micheltsarasoa/nutrigo/commit/cca472a7859c9465e24b5ee016f2fafa287b08cc))
* **api:** add `GET /api/nutrition/day/:date` and `/week/:isoWeek` ([#210](https://github.com/micheltsarasoa/nutrigo/issues/210)) ([06f931d](https://github.com/micheltsarasoa/nutrigo/commit/06f931d0f37d3bd07344c1e4a84590810f614d6d))
* **api:** add `GET` and `PUT /api/targets` ([#211](https://github.com/micheltsarasoa/nutrigo/issues/211)) ([c24b6eb](https://github.com/micheltsarasoa/nutrigo/commit/c24b6eb5e304ffab8fac85347b7a5e9af7882644))
* **api:** add the eaten columns and the `POST`/`DELETE …/entries/:id/eaten` endpoints ([#209](https://github.com/micheltsarasoa/nutrigo/issues/209)) ([98d9c17](https://github.com/micheltsarasoa/nutrigo/commit/98d9c1735cff72949b2acbaa652891f2fe35a1d8))
* **shared:** add `dayNutrition`, `nextMealId`, `weekNutrition` and the `Targets` schema ([#208](https://github.com/micheltsarasoa/nutrigo/issues/208)) ([b9723d9](https://github.com/micheltsarasoa/nutrigo/commit/b9723d9de03ef0661be9a568d867c39c78c6c1b7))
* **web:** add the ColumnChart organism ([#217](https://github.com/micheltsarasoa/nutrigo/issues/217)) ([a0b87c3](https://github.com/micheltsarasoa/nutrigo/commit/a0b87c36e20c7d7d4c7aa27591f6b24b11313ef0))
* **web:** add the CaloriesCard organism ([#216](https://github.com/micheltsarasoa/nutrigo/issues/216)) ([69c9f8b](https://github.com/micheltsarasoa/nutrigo/commit/69c9f8b18039bf11d336823560b210c39dcc483b))
* **web:** add the TargetsForm organism ([#218](https://github.com/micheltsarasoa/nutrigo/issues/218)) ([8b3b272](https://github.com/micheltsarasoa/nutrigo/commit/8b3b272a9fb2cd9ea856efdb05efb9af4b0acc49))
* **web:** add the Ring organism ([#215](https://github.com/micheltsarasoa/nutrigo/issues/215)) ([ad9cf71](https://github.com/micheltsarasoa/nutrigo/commit/ad9cf711d8d9bc1465bd6be6ee39056c716deea9))
* **web:** add the MealItem molecule ([#213](https://github.com/micheltsarasoa/nutrigo/issues/213)) ([89ce1ef](https://github.com/micheltsarasoa/nutrigo/commit/89ce1efa84fffacc206fbd2e4a54474485e45942))
* **web:** add the ServingsPrompt molecule ([#214](https://github.com/micheltsarasoa/nutrigo/issues/214)) ([2998690](https://github.com/micheltsarasoa/nutrigo/commit/2998690ff825936acf5161f4439d0dacef82ed1c))
* **web:** add the MacroBar molecule ([#212](https://github.com/micheltsarasoa/nutrigo/issues/212)) ([c3dacf1](https://github.com/micheltsarasoa/nutrigo/commit/c3dacf1a835b401388b0bc42980730e0d5dbe611))

### Bug Fixes

* **web:** skip axe `landmark-unique` on playground galleries ([#235](https://github.com/micheltsarasoa/nutrigo/issues/235)) ([95386ff](https://github.com/micheltsarasoa/nutrigo/commit/95386fffde1c13068d58288d014443f1021ab9e1))

## [0.3.0](https://github.com/micheltsarasoa/nutrigo/compare/v0.2.0...v0.3.0) (2026-10-15)

Weekly meal plan (SPEC-003): plan a week from your recipes. Also a searchable, sortable ingredients table.

### Features

* add the weekly meal plan: API, week functions, components and the PlanPage ([#203](https://github.com/micheltsarasoa/nutrigo/issues/203)) ([e4a1a89](https://github.com/micheltsarasoa/nutrigo/commit/e4a1a89fc2fddeb97f69b12e9590a9c874da4cd9))
* **web:** show ingredients in a table with search, category and sort ([#171](https://github.com/micheltsarasoa/nutrigo/issues/171)) ([f1cedc8](https://github.com/micheltsarasoa/nutrigo/commit/f1cedc858d3524b33cadae483403c39f8b244b1f))
* **web:** add the IngredientList table ([#170](https://github.com/micheltsarasoa/nutrigo/issues/170)) ([520232a](https://github.com/micheltsarasoa/nutrigo/commit/520232adc22ebf5557a48b4d978c4680412ca3a7))

### Bug Fixes

* **web:** lay the recipe detail out in 3 columns, with a green stepper and photos ([#176](https://github.com/micheltsarasoa/nutrigo/issues/176)) ([42493c7](https://github.com/micheltsarasoa/nutrigo/commit/42493c73885cebbb3a2cdf1000c71a4d3e0f91b4))

## [0.2.0](https://github.com/micheltsarasoa/nutrigo/compare/v0.1.0...v0.2.0) (2026-09-29)


### Features

* add db:backup, the smoke e2e and the restore drill ([#167](https://github.com/micheltsarasoa/nutrigo/issues/167)) ([4d88d09](https://github.com/micheltsarasoa/nutrigo/commit/4d88d09240795af2ba0fbb688d3c7930f322979e))
* **api:** add GET and PUT /api/settings ([#153](https://github.com/micheltsarasoa/nutrigo/issues/153)) ([506866b](https://github.com/micheltsarasoa/nutrigo/commit/506866ba6027d9856a89983e3f756b09fc88f948))
* **api:** add the /api/ingredients routes ([#120](https://github.com/micheltsarasoa/nutrigo/issues/120)) ([983eff1](https://github.com/micheltsarasoa/nutrigo/commit/983eff1c3f4b3fa4ca1ff85728bd3b3e2cfa316e))
* **api:** add the ingredient, recipe and settings tables ([#114](https://github.com/micheltsarasoa/nutrigo/issues/114)) ([6ec758f](https://github.com/micheltsarasoa/nutrigo/commit/6ec758f816587e9cdda4b85609b479bbda377b8e))
* **api:** add the recipe create, replace and delete routes ([#122](https://github.com/micheltsarasoa/nutrigo/issues/122)) ([2b7c683](https://github.com/micheltsarasoa/nutrigo/commit/2b7c683a1248f5c491b6b5c3bc8ad37ddadce259))
* **api:** add the recipe list and detail routes ([#121](https://github.com/micheltsarasoa/nutrigo/issues/121)) ([f75c7fc](https://github.com/micheltsarasoa/nutrigo/commit/f75c7fc28e2421f9c44dbc75cf1352a884982eb2))
* **shared:** add formatNumber and formatEUR ([#112](https://github.com/micheltsarasoa/nutrigo/issues/112)) ([a18ac3b](https://github.com/micheltsarasoa/nutrigo/commit/a18ac3b02a76da51809081a003846f6157f2e1f2))
* **shared:** add the ingredient, recipe and settings schemas ([#110](https://github.com/micheltsarasoa/nutrigo/issues/110)) ([c2a4bde](https://github.com/micheltsarasoa/nutrigo/commit/c2a4bde8034922750cc58aecf35c4e263a0512d0))
* **shared:** add the nutrition functions of SPEC-002 ([#111](https://github.com/micheltsarasoa/nutrigo/issues/111)) ([5990e9d](https://github.com/micheltsarasoa/nutrigo/commit/5990e9d66936e97a42971f0035b196127dadcfd2))
* **web:** add the Field atom ([#116](https://github.com/micheltsarasoa/nutrigo/issues/116)) ([6825eca](https://github.com/micheltsarasoa/nutrigo/commit/6825eca535d1c783f57b17dabc4fdfbeec61319f))
* **web:** add the FilterTabs atom ([#119](https://github.com/micheltsarasoa/nutrigo/issues/119)) ([1596820](https://github.com/micheltsarasoa/nutrigo/commit/15968207787920be3f745724317965886c795df0))
* **web:** add the IconButton atom and a settings icon ([#124](https://github.com/micheltsarasoa/nutrigo/issues/124)) ([6bc9ab2](https://github.com/micheltsarasoa/nutrigo/commit/6bc9ab267f6333fbb84527604d05e3cef24a4840))
* **web:** add the IngredientEditor organism ([#148](https://github.com/micheltsarasoa/nutrigo/issues/148)) ([0fba009](https://github.com/micheltsarasoa/nutrigo/commit/0fba0097f60cb0dfdf33dcc200145c370e6e318f))
* **web:** add the IngredientRow molecule ([#138](https://github.com/micheltsarasoa/nutrigo/issues/138)) ([e1b87b2](https://github.com/micheltsarasoa/nutrigo/commit/e1b87b22221ba1ccec473c53f9212c2d8894ff81))
* **web:** add the IngredientsPage (list, new, edit, delete) ([#155](https://github.com/micheltsarasoa/nutrigo/issues/155)) ([04ebaa1](https://github.com/micheltsarasoa/nutrigo/commit/04ebaa19b3ec85bf26c2663fabce03f3d453bc1f))
* **web:** add the MacroTile molecule ([#129](https://github.com/micheltsarasoa/nutrigo/issues/129)) ([a40bdde](https://github.com/micheltsarasoa/nutrigo/commit/a40bddeef547887fa20c4be4209ca7c13998ead5))
* **web:** add the MenuListItem molecule ([#140](https://github.com/micheltsarasoa/nutrigo/issues/140)) ([21c464e](https://github.com/micheltsarasoa/nutrigo/commit/21c464eff6bf93aad12bb4facaa6b66c4f65ad1b))
* **web:** add the MetaRow molecule ([#128](https://github.com/micheltsarasoa/nutrigo/issues/128)) ([e646151](https://github.com/micheltsarasoa/nutrigo/commit/e646151f03d1a8aa3f71fea85c41bd5064d873f4))
* **web:** add the NoteItem molecule ([#135](https://github.com/micheltsarasoa/nutrigo/issues/135)) ([bd464ca](https://github.com/micheltsarasoa/nutrigo/commit/bd464ca9f870944a3ecdd9217c1a4b59bad92cf2))
* **web:** add the NutritionRow molecule ([#132](https://github.com/micheltsarasoa/nutrigo/issues/132)) ([0fe7887](https://github.com/micheltsarasoa/nutrigo/commit/0fe78876e042c8f0586d2083452dc726ebf49678))
* **web:** add the PhotoOrPlaceholder molecule ([#139](https://github.com/micheltsarasoa/nutrigo/issues/139)) ([c00adc6](https://github.com/micheltsarasoa/nutrigo/commit/c00adc6c24ed75ade5b79d754526023b7acd51ec))
* **web:** add the prep and cook icons ([#131](https://github.com/micheltsarasoa/nutrigo/issues/131)) ([99b4cb7](https://github.com/micheltsarasoa/nutrigo/commit/99b4cb7cbfecbdf0951b5b66a7ae0bffc0cade58))
* **web:** add the RecipeDetail organism ([#146](https://github.com/micheltsarasoa/nutrigo/issues/146)) ([1f3936c](https://github.com/micheltsarasoa/nutrigo/commit/1f3936cb713569b6ae0d32f387fbd345e05069ba))
* **web:** add the RecipeEditor organism ([#147](https://github.com/micheltsarasoa/nutrigo/issues/147)) ([a71c8ee](https://github.com/micheltsarasoa/nutrigo/commit/a71c8ee207de5764a28b7354b2e6564eb26cf3f9))
* **web:** add the RecipeEditPage (new and edit) ([#161](https://github.com/micheltsarasoa/nutrigo/issues/161)) ([909bcba](https://github.com/micheltsarasoa/nutrigo/commit/909bcbad3b1307466899a97d54988f13a8a38b46))
* **web:** add the RecipeList organism ([#143](https://github.com/micheltsarasoa/nutrigo/issues/143)) ([8369b19](https://github.com/micheltsarasoa/nutrigo/commit/8369b19c22c5cd75151b65adc5ec8a10fa09d36d))
* **web:** add the RecipePage (scale servings, nutrition, health score) ([#163](https://github.com/micheltsarasoa/nutrigo/issues/163)) ([f19e330](https://github.com/micheltsarasoa/nutrigo/commit/f19e3302eab4a8ecc50a340f72ed7eb22ee5565c))
* **web:** add the RecipesPage (browse, search, filter, sort) ([#162](https://github.com/micheltsarasoa/nutrigo/issues/162)) ([1f0e164](https://github.com/micheltsarasoa/nutrigo/commit/1f0e164a94871507b25345c559976d9e89b695a4))
* **web:** add the RecipeStep molecule ([#137](https://github.com/micheltsarasoa/nutrigo/issues/137)) ([efeb837](https://github.com/micheltsarasoa/nutrigo/commit/efeb8378a05f548aa3afcea68fb2ab50f21b0738))
* **web:** add the Segmented atom ([#118](https://github.com/micheltsarasoa/nutrigo/issues/118)) ([22bc6de](https://github.com/micheltsarasoa/nutrigo/commit/22bc6ded164e52e797e09893fe49eca008da3718))
* **web:** add the Select atom ([#117](https://github.com/micheltsarasoa/nutrigo/issues/117)) ([dc21527](https://github.com/micheltsarasoa/nutrigo/commit/dc21527f7b4ef2ee4de44b1aa005374d62e5b074))
* **web:** add the SettingRow molecule ([#141](https://github.com/micheltsarasoa/nutrigo/issues/141)) ([6a1a712](https://github.com/micheltsarasoa/nutrigo/commit/6a1a7129a4622e3290fd0c475e08d93942f0aaea))
* **web:** add the settings entry to the AppShell ([#151](https://github.com/micheltsarasoa/nutrigo/issues/151)) ([813dec4](https://github.com/micheltsarasoa/nutrigo/commit/813dec403d2c9558a392e7a775e0547fb641d452))
* **web:** add the SettingsDialog organism ([#149](https://github.com/micheltsarasoa/nutrigo/issues/149)) ([973f646](https://github.com/micheltsarasoa/nutrigo/commit/973f646f58b75c58b976d52307a099fa6231bfeb))
* **web:** add the ToolItem molecule ([#133](https://github.com/micheltsarasoa/nutrigo/issues/133)) ([5277e11](https://github.com/micheltsarasoa/nutrigo/commit/5277e111d0e6cc9790227c478d401a7e9edb184c))
* **web:** open Settings from the app and save the locale ([#154](https://github.com/micheltsarasoa/nutrigo/issues/154)) ([92a54f3](https://github.com/micheltsarasoa/nutrigo/commit/92a54f31b2dabc8d688fbe257432f99436d2d93f))


### Bug Fixes

* **web:** give md buttons a 44 px hit area ([#157](https://github.com/micheltsarasoa/nutrigo/issues/157)) ([c4d6938](https://github.com/micheltsarasoa/nutrigo/commit/c4d6938669a4ff7174dc8f04eea09ab8ada522e5))
* **web:** keep the MenuListItem top row inside narrow cards ([#145](https://github.com/micheltsarasoa/nutrigo/issues/145)) ([531ba90](https://github.com/micheltsarasoa/nutrigo/commit/531ba907df1ddb318c51de56f18d69f2d9798b88))
* **web:** use 16 px text in SelectPill and SearchField ([#125](https://github.com/micheltsarasoa/nutrigo/issues/125)) ([d0a6aab](https://github.com/micheltsarasoa/nutrigo/commit/d0a6aabda4212332a08a0eda7a01cbf3bed349a3))

## 0.1.0 (2026-09-24)


### Features

* add the Dockerfile and docker-compose, with the API serving the web build ([#41](https://github.com/micheltsarasoa/nutrigo/issues/41)) ([eb68b69](https://github.com/micheltsarasoa/nutrigo/commit/eb68b6912aaa35f215402f694289322cc1ca387a))
* **api:** add SQLite with Drizzle migrations and GET /api/health ([#39](https://github.com/micheltsarasoa/nutrigo/issues/39)) ([daf5c3e](https://github.com/micheltsarasoa/nutrigo/commit/daf5c3efc38a4d60b9988d897042b82cae48cdff))
* generate tokens.css from tokens.json and self-host Poppins ([#38](https://github.com/micheltsarasoa/nutrigo/issues/38)) ([6fc90f4](https://github.com/micheltsarasoa/nutrigo/commit/6fc90f492bd4e30d7e63a48a5abf426611bedf9e))
* scaffold npm workspaces with lint, unit and e2e tooling ([#37](https://github.com/micheltsarasoa/nutrigo/issues/37)) ([185513e](https://github.com/micheltsarasoa/nutrigo/commit/185513eb994e39c144b33f2bf94bb552d134a428))
* **web:** add the /playground route with auto-discovered demos ([#40](https://github.com/micheltsarasoa/nutrigo/issues/40)) ([222e2fb](https://github.com/micheltsarasoa/nutrigo/commit/222e2fb140311e739f821ed442ed381ee1564450))
* **web:** add the AppShell organism, bottom tab bar and 252 px sidebar ([#62](https://github.com/micheltsarasoa/nutrigo/issues/62)) ([2698a9f](https://github.com/micheltsarasoa/nutrigo/commit/2698a9f6ee92553afc4a5c57cc65bd06630fa2c8))
* **web:** add the Button atom with 3 variants, 2 sizes, disabled and loading ([#48](https://github.com/micheltsarasoa/nutrigo/issues/48)) ([6067819](https://github.com/micheltsarasoa/nutrigo/commit/6067819af687dc8df55aeda3a4a4588915727dde))
* **web:** add the Card atom, optional heading and more button ([#60](https://github.com/micheltsarasoa/nutrigo/issues/60)) ([bb501c1](https://github.com/micheltsarasoa/nutrigo/commit/bb501c192d83811fdb9bd61422431c5ec0020cf8))
* **web:** add the Icon atom with the 20 in-scope icons ([#42](https://github.com/micheltsarasoa/nutrigo/issues/42)) ([f1e25b9](https://github.com/micheltsarasoa/nutrigo/commit/f1e25b9f66f4ca42d23bbcc1d2ac6a8e8835d531))
* **web:** add the IconBadge atom, 7 variants in 28 and 44 px ([#50](https://github.com/micheltsarasoa/nutrigo/issues/50)) ([42a31bc](https://github.com/micheltsarasoa/nutrigo/commit/42a31bcbeb0480a0f91b3460c7194093eb87571c))
* **web:** add the Logo atom, mark and lockup in 3 sizes ([#47](https://github.com/micheltsarasoa/nutrigo/issues/47)) ([a1dc45f](https://github.com/micheltsarasoa/nutrigo/commit/a1dc45f38afb22095f90003c6e9290a4964ad90b))
* **web:** add the MealCheck atom, a native checkbox with done, todo and next ([#58](https://github.com/micheltsarasoa/nutrigo/issues/58)) ([2c80817](https://github.com/micheltsarasoa/nutrigo/commit/2c808177684b8b82493fba1300a57397348f39d4))
* **web:** add the NavLink atom, sidebar and tab-bar variants with an active state ([#57](https://github.com/micheltsarasoa/nutrigo/issues/57)) ([f6c472c](https://github.com/micheltsarasoa/nutrigo/commit/f6c472c0aa25e3a6c131a0ac83b45854f0f2bdb0))
* **web:** add the Pill atom with 8 variants and an optional icon ([#49](https://github.com/micheltsarasoa/nutrigo/issues/49)) ([265c64d](https://github.com/micheltsarasoa/nutrigo/commit/265c64d6eaf9c0b844ad098164b0f43687feb8c9))
* **web:** add the ProgressBar atom, 3 fills, thin, and a capped over state ([#53](https://github.com/micheltsarasoa/nutrigo/issues/53)) ([3692712](https://github.com/micheltsarasoa/nutrigo/commit/3692712c1baf1f4e62b6bd4bdbdb9a84f1efe988))
* **web:** add the SearchField atom, md and sm, plain or filled ([#51](https://github.com/micheltsarasoa/nutrigo/issues/51)) ([a863871](https://github.com/micheltsarasoa/nutrigo/commit/a863871f4fd2cc2dacc2a4caa107cb21af60fe0d))
* **web:** add the SelectPill atom, a native select styled as the pill ([#54](https://github.com/micheltsarasoa/nutrigo/issues/54)) ([0f4500f](https://github.com/micheltsarasoa/nutrigo/commit/0f4500f41152611b62e999e444c9917f9423b12b))
* **web:** add the StarRating atom, read-only 0-5 and an editable radio group ([#59](https://github.com/micheltsarasoa/nutrigo/issues/59)) ([8da4a0b](https://github.com/micheltsarasoa/nutrigo/commit/8da4a0b4450e97dbb0ac6f9a78388c0519554f51))
* **web:** add the Stepper atom, a spinbutton with − and + buttons ([#55](https://github.com/micheltsarasoa/nutrigo/issues/55)) ([7e6de42](https://github.com/micheltsarasoa/nutrigo/commit/7e6de42b442a2dd3b02c1636764498fb1b07f189))
* **web:** make the app installable as a PWA with vite-plugin-pwa ([#64](https://github.com/micheltsarasoa/nutrigo/issues/64)) ([7371df8](https://github.com/micheltsarasoa/nutrigo/commit/7371df833c8042c242a1a0b0fc3278397acbae25))
* **web:** route the 5 destinations inside the AppShell, tab bar below 1200 px and sidebar above ([#65](https://github.com/micheltsarasoa/nutrigo/issues/65)) ([f0a3c02](https://github.com/micheltsarasoa/nutrigo/commit/f0a3c0290192caf0e9da08db0e24c26abb62018d))
