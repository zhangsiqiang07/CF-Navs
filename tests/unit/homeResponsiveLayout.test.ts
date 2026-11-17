import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// 断言 `src/views/Home.svelte`/`HomeHeroSearch.svelte`/`App.svelte`/`app.css` 里响应式边距的组合方式：
// `@media (max-width: 799px/720px)` 断点内 padding/margin 是否用 `calc()` 叠加 `--content-margin-x/-top/-bottom`
// 变量（横向边距限桌面、顶部边距两端都加），移动 overscroll 背景 `var(--home-background)`+`background-attachment: fixed`，
// 以及排序工具条的 `grid-template-areas`、`env(safe-area-inset-*)`。这些是媒体查询规则与布局合成结果，
// jsdom 不评估媒体查询、不做布局、不解析 `calc()`/`env()`，挂载后 `getComputedStyle` 拿不到断点内有效值。（PROB-18）

describe('home responsive layout', () => {
 it('keeps the configurable horizontal margin desktop-only', () => {
  const home = readFileSync('src/views/Home.svelte', 'utf8')
  const mobileStyles = home.slice(home.indexOf('@media (max-width: 799px)'))

  expect(home).toContain('padding: 1.5rem calc(1.5rem + var(--content-margin-x, 0px))')
  expect(mobileStyles).toContain('padding: 1rem 1rem calc(var(--content-margin-bottom, 0%) + var(--home-sort-bottom-inset, 0px));')
  expect(mobileStyles).not.toContain('var(--content-margin-x')
 })

 it('applies the configurable top margin on mobile too', () => {
  const hero = readFileSync('src/components/HomeHeroSearch.svelte', 'utf8')
  const mobileStyles = hero.slice(hero.indexOf('@media (max-width: 720px)'))

  // 设置项标签是「顶部边距」，没有像「桌面左右边距」那样限定桌面，所以两边都要叠加变量
  expect(hero).toContain('margin: calc(3rem + var(--content-margin-top, 0%)) auto 1.25rem;')
  expect(mobileStyles).toContain('margin-top: calc(3.5rem + var(--content-margin-top, 0%));')
  expect(mobileStyles).toContain('margin-top: calc(3rem + var(--content-margin-top, 0%));')
  // 回归护栏：移动端一旦写回裸值，用户设的顶部边距就会在 ≤720px 被整个丢掉
  expect(mobileStyles).not.toMatch(/margin-top:\s*3(\.5)?rem;/)
 })
 it('paints mobile overscroll with the active homepage background', () => {
  // 根变量写入已抽到 rootStyleWriter（行为见 tests/unit/rootStyleWriter.test.ts），这里只守接线。
  const app = readFileSync('src/App.svelte', 'utf8')
  const writer = readFileSync('src/lib/rootStyleWriter.ts', 'utf8')
  const globalStyles = readFileSync('src/app.css', 'utf8')

  expect(app).toContain('rootStyleWriter?.applyTheme(')
  expect(writer).toContain("'--home-background'")
  expect(writer).toContain("'--home-background-mask'")
  expect(writer).toContain("'--home-background-mask-color'")
  expect(writer).toContain('root.style.setProperty')
  expect(globalStyles).toContain('var(--home-background);')
  expect(globalStyles).toContain('background-attachment: fixed;')
 })
 it('uses a full-width two-row mobile sort toolbar', () => {
  const home = readFileSync('src/views/Home.svelte', 'utf8')
  const mobileStyles = home.slice(home.indexOf('@media (max-width: 799px)'))

  expect(home).toContain('class:error-state={Boolean(homeSortError)}')
  expect(home).toContain('class="home-sort-message"')
  expect(mobileStyles).toContain('left: max(12px, env(safe-area-inset-left));')
  expect(mobileStyles).toContain('right: max(12px, env(safe-area-inset-right));')
  expect(mobileStyles).toContain("grid-template-areas: 'message message' 'cancel save';")
  expect(mobileStyles).toContain('white-space: normal;')
 })

  it('wraps child categories before the floating action row', () => {
    const scope = readFileSync('src/components/HomeCategoryScope.svelte', 'utf8')
    const mobileStyles = scope.slice(scope.indexOf('@media (max-width: 720px)'))

    expect(scope).toContain('.category-scope.has-actions .scope-title-row {\n    box-sizing: border-box;\n    padding-right: 320px;')
    expect(scope).toMatch(/\.scope-tabs \{[^}]*flex-wrap: wrap;/)
    expect(scope).not.toContain('overflow-x: auto;')
    expect(mobileStyles).toContain('.category-scope.has-actions .scope-title-row {\n      padding-right: 0;')
  })

  it('在桌面与移动派生值中保持二级字体小于一级', () => {
    const home = readFileSync('src/views/Home.svelte', 'utf8')
    const mobileStyles = home.slice(home.indexOf('@media (max-width: 799px)'))

    expect(home).toContain('--category-child-font-size: min(var(--category-child-font-size-base, 14px), calc(var(--category-root-font-size) - 1px));')
    expect(mobileStyles).toContain('--category-child-font-size: min(calc(var(--category-child-font-size-base, 14px) * 0.88), calc(var(--category-root-font-size) - 1px));')
  })
})
