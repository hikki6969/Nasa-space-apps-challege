declare module 'plotly.js-dist-min' {
  export interface PlotlyTrace {
    type: string
    [key: string]: unknown
  }

  export interface PlotlyLayout {
    [key: string]: unknown
  }

  export interface PlotlyConfig {
    [key: string]: unknown
  }

  export type PlotlyHTMLElement = HTMLElement

  export interface PlotlyStatic {
    newPlot(
      root: HTMLElement,
      data: readonly PlotlyTrace[],
      layout?: PlotlyLayout,
      config?: PlotlyConfig,
    ): Promise<PlotlyHTMLElement>
    react(
      root: HTMLElement,
      data: readonly PlotlyTrace[],
      layout?: PlotlyLayout,
      config?: PlotlyConfig,
    ): Promise<PlotlyHTMLElement>
    purge(root: HTMLElement): void
    Plots: {
      resize(root: HTMLElement): void
    }
  }

  const Plotly: PlotlyStatic
  export default Plotly
}
