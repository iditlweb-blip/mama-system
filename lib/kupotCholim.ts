// Israeli health funds (קופות חולים) - used so a pregnant woman can link
// straight from a test card to her own fund's pregnancy-tests page instead
// of a generic disclaimer. Links point at each fund's public "tests during
// pregnancy" hub page (found via public web search), not a specific test -
// the funds restructure their per-test eligibility pages often enough that
// one stable hub per fund is far more maintainable than ~12 tests × 4 funds
// of deep links that would silently rot.

export type KupatCholim = 'clalit' | 'maccabi' | 'meuhedet' | 'leumit'

export const KUPOT_CHOLIM: { value: KupatCholim; label: string; url: string }[] = [
  { value: 'clalit',   label: 'כללית',  url: 'https://mushlam.clalit.co.il/he/woman/during_pregnancy/Pages/pregnancy_tests.aspx' },
  { value: 'maccabi',  label: 'מכבי',   url: 'https://www.maccabi4u.co.il/eligibilities_insuranceplan/eligibilities/tests/%D7%91%D7%93%D7%99%D7%A7%D7%95%D7%AA-%D7%94%D7%A8%D7%99%D7%95%D7%9F/' },
  { value: 'meuhedet', label: 'מאוחדת', url: 'https://www.meuhedet.co.il/%D7%91%D7%99%D7%98%D7%95%D7%97%D7%99%D7%9D/%D7%9E%D7%90%D7%95%D7%97%D7%93%D7%AA-%D7%A9%D7%99%D7%90/%D7%94%D7%99%D7%A8%D7%99%D7%95%D7%9F-%D7%95%D7%9C%D7%99%D7%93%D7%94/' },
  { value: 'leumit',   label: 'לאומית', url: 'https://www.leumit.co.il/pregnancy/during-your-pregnancy/the-tests-are-recommended-during-pregnancy/' },
]

export function kupatCholimUrl(value: KupatCholim | string | null | undefined): string | null {
  return KUPOT_CHOLIM.find(k => k.value === value)?.url ?? null
}

export function kupatCholimLabel(value: KupatCholim | string | null | undefined): string | null {
  return KUPOT_CHOLIM.find(k => k.value === value)?.label ?? null
}
