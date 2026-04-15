import React, { useEffect, useRef } from 'react'
import katex from 'katex'

interface Props {
  formula: string
  inline?: boolean
}

export default function FormulaBlock({ formula, inline = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(formula, ref.current, {
          throwOnError: false,
          displayMode: !inline,
        })
      } catch (e) {
        if (ref.current) ref.current.textContent = formula
      }
    }
  }, [formula, inline])

  return (
    <div
      ref={ref}
      className={inline ? 'inline-block' : 'block text-center my-1'}
      style={{ fontFamily: 'monospace' }}
    />
  )
}
