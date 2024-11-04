import './index.css'
import { Virtualizer } from '@tanstack/virtual-core'
import Konva from 'konva'
import { throttle } from 'lodash-es'

export type IndexMap<T> = { [key: number]: T; length: number }
export type Row = { h: number }
export type Column = { w: number }
export type IndexRow = IndexMap<Row>
export type IndexColumn = IndexMap<Column>

interface OfficeSuiteOptions {
  root: HTMLDivElement
  /**
   * 默认列宽
   * @default 80
   */
  defaultWidth?: number
  /**
   * 默认行高
   * @default 30
   */
  defaultHeight?: number

  rows: IndexMap<{ h: number }>
  columns: IndexMap<{ w: number }>
}

export class OfficeSuite {
  root: HTMLDivElement
  scrollWrap: HTMLDivElement
  options: Omit<OfficeSuiteOptions, 'root'>

  #stage: Konva.Stage
  #resizeObserver: ResizeObserver
  #rowVirtualizer: Virtualizer<HTMLDivElement, HTMLDivElement>
  #columnVirtualizer: Virtualizer<HTMLDivElement, HTMLDivElement>

  constructor(options: OfficeSuiteOptions) {
    const sceneWidth = window.innerWidth
    const sceneHeight = window.innerHeight
    console.log('OfficeSuite', options)
    this.root = options.root
    this.options = {
      ...options,
      defaultWidth: options.defaultWidth || 80,
      defaultHeight: options.defaultHeight || 30,
    }

    this.#resizeObserver = new ResizeObserver(
      throttle(() => {
        this.#stage.width(this.root.clientWidth)
        this.#stage.height(this.root.clientHeight)
      }, 200),
    )
    this.#resizeObserver.observe(this.root)

    this.#rowVirtualizer = new Virtualizer({
      // debug: true,
      count: this.options.rows.length,
      estimateSize: (index) =>
        this.options.rows[index + 1]?.h || this.options.defaultHeight!,
      getScrollElement: () => this.scrollWrap,
      overscan: 5,
      observeElementOffset: (instance, cb) => {
        instance.scrollElement?.addEventListener(
          'scroll',
          (e) => {
            const offset = (e.target as HTMLElement).scrollTop
            this.#stage.offsetY(offset)
            cb(offset, true)
          },
          { passive: true },
        )
      },
      scrollToFn: (offset, { behavior }) => {
        this.root.scrollTo({
          top: offset,
          behavior,
        })
      },
      observeElementRect: (instance, cb) => {
        let resizeObserver: ResizeObserver | null = null
        if (instance.scrollElement) {
          resizeObserver = new ResizeObserver(() => {
            cb(
              instance.scrollElement?.getBoundingClientRect() || {
                width: 0,
                height: 0,
              },
            )
          })
          resizeObserver.observe(instance.scrollElement)
        }
        return () => resizeObserver?.disconnect()
      },
      onChange: () => {
        this.render()
      },
    })

    this.#columnVirtualizer = new Virtualizer({
      // debug: true,
      horizontal: true,
      count: this.options.columns.length,
      estimateSize: (index) =>
        this.options.columns[index + 1]?.w || this.options.defaultWidth!,
      getScrollElement: () => this.scrollWrap,
      overscan: 5,
      observeElementOffset: (instance, cb) => {
        instance.scrollElement?.addEventListener(
          'scroll',
          (e) => {
            const offset = (e.target as HTMLElement).scrollLeft
            this.#stage.offsetX(offset)
            cb(offset, true)
          },
          { passive: true },
        )
      },
      scrollToFn: (offset, { behavior }) => {
        this.root.scrollTo({
          left: offset,
          behavior,
        })
      },
      observeElementRect: (instance, cb) => {
        let resizeObserver: ResizeObserver | null = null
        if (instance.scrollElement) {
          resizeObserver = new ResizeObserver(() => {
            cb(
              instance.scrollElement?.getBoundingClientRect() || {
                width: 0,
                height: 0,
              },
            )
          })
          resizeObserver.observe(instance.scrollElement)
        }
        return () => resizeObserver?.disconnect()
      },
      onChange: () => {
        this.render()
      },
    })
    this.scrollWrap = document.createElement('div')
    this.scrollWrap.classList.add('of-scroll-wrap')
    const container = document.createElement('div')
    container.classList.add('of-container')
    const placeholder = document.createElement('div')
    placeholder.style.height = `${this.#rowVirtualizer.getTotalSize()}px`
    placeholder.style.width = `${this.#columnVirtualizer.getTotalSize()}px`

    this.scrollWrap.appendChild(placeholder)
    this.scrollWrap.appendChild(container)
    this.root.appendChild(this.scrollWrap)

    this.#columnVirtualizer._willUpdate()
    this.#rowVirtualizer._willUpdate()

    // setup konva
    Konva.pixelRatio = 1
    this.#stage = new Konva.Stage({
      container: container,
      width: sceneWidth,
      height: sceneHeight,
    })

    this.render()
  }

  render() {
    performance.mark('render')
    // TODO: 考虑优化渲染性能
    this.#stage.destroyChildren()
    const gridLayer = new Konva.Layer()
    // const gridLayer = new Konva.Line()
    const cacheRect = new Konva.Rect({
      width: this.options.defaultWidth,
      height: this.options.defaultHeight,
      // stroke: '#ccc',
      // strokeWidth: 1,
    }).cache()

    const rowVirtualItems = this.#rowVirtualizer.getVirtualItems()
    const columnVirtualItems = this.#columnVirtualizer.getVirtualItems()
    console.log('🚀 ~ OfficeSuite ~ render ~ rowVirtualItems:', rowVirtualItems)
    console.log(
      '🚀 ~ OfficeSuite ~ render ~ columnVirtualItems:',
      columnVirtualItems,
    )

    for (let vRowIndex = 0; vRowIndex < rowVirtualItems.length; vRowIndex++) {
      const virtualRow = rowVirtualItems[vRowIndex]
      const rowIndex = virtualRow.index + 1
      const row = this.options.rows[rowIndex] || {
        h: this.options.defaultHeight,
      }
      const h = row.h
      for (
        let vColumnIndex = 0;
        vColumnIndex < columnVirtualItems.length;
        vColumnIndex++
      ) {
        const virtualColumn = columnVirtualItems[vColumnIndex]
        const columnIndex = virtualColumn.index + 1
        const column = this.options.columns[columnIndex] || {
          w: this.options.defaultWidth,
        }
        const w = column.w
        const rect = cacheRect?.clone({
          width: w,
          height: h,
        }) as Konva.Rect
        const text = new Konva.Text({
          id: `${rowIndex}-${columnIndex}-text`,
          x: 0,
          y: 0,
          text: `${rowIndex}-${columnIndex}`,
          align: 'center',
          verticalAlign: 'middle',
        })
        text.offsetX(-text.width() / 2)
        text.offsetY(-text.height() / 2)

        const group = new Konva.Group({
          x: virtualColumn.start,
          y: virtualRow.start,
        })
        group.add(rect)
        group.add(text)

        group.addEventListener('click', () => {
          console.log('click', rowIndex, columnIndex)
        })
        group.addEventListener('dblclick', () => {
          console.log('dblclick', rowIndex, columnIndex)
        })
        gridLayer.add(group)
      }
    }
    this.#stage.add(gridLayer)
    performance.measure('render', 'render')
  }

  async destroy() {
    this.#resizeObserver?.disconnect()
    this.#stage.destroy()
  }
}
