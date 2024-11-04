import { OfficeSuite } from '@office-suite/core'
import '@office-suite/core/index.css'
import type { IndexColumn, IndexRow } from '@office-suite/core'
import { useEffect, useRef } from 'react'

function App() {
  const ref = useRef<HTMLDivElement>(null)
  const excel = useRef<OfficeSuite>()
  const rows: IndexRow = {
    length: 1000,
  }
  const columns: IndexColumn = {
    length: 1000,
  }
  useEffect(() => {
    if (!excel.current) {
      excel.current = new OfficeSuite({
        root: ref.current!,
        rows,
        columns,
        defaultHeight: 30,
        defaultWidth: 100,
      })
    }
    return () => {
      excel.current?.destroy()
    }
  }, [])
  return <div id="office-suite" ref={ref} />
}

export default App
