import { Dispatch, SetStateAction, useCallback } from 'react'
import { useContext, useContextSelector } from 'use-context-selector'

import { StateContext, ActionsContext, AtomState } from './Provider'
import { Atom, WritableAtom, AnyWritableAtom } from './types'
import { useIsoLayoutEffect } from './utils'

const isWritable = <Value, WriteValue>(
  atom: Atom<Value> | WritableAtom<Value, WriteValue>
): atom is WritableAtom<Value, WriteValue> =>
  !!(atom as WritableAtom<Value, WriteValue>).write

export function useAtom<Value, WriteValue>(
  atom: WritableAtom<Value, WriteValue>
): [Value, Dispatch<SetStateAction<WriteValue>>]

export function useAtom<Value>(atom: Atom<Value>): [Value, never]

export function useAtom<Value, WriteValue>(
  atom: Atom<Value> | WritableAtom<Value, WriteValue>
) {
  const actions = useContext(ActionsContext)
  const promiseOrValue = useContextSelector(
    StateContext,
    useCallback(
      (state) => {
        const atomState = state.get(atom) as AtomState<Value> | undefined
        if (!atomState) return atom.initialValue
        if (atomState.promise) return atomState.promise
        return atomState.value
      },
      [atom]
    )
  )
  const setAtom = useCallback(
    (update: SetStateAction<WriteValue>) => {
      if (isWritable(atom)) {
        actions.update(atom as AnyWritableAtom, update)
      } else {
        throw new Error('not writable atom')
      }
    },
    [atom, actions]
  )
  useIsoLayoutEffect(() => {
    const id = Symbol()
    actions.init(id, atom)
    return () => {
      actions.dispose(id)
    }
  }, [actions, atom])
  if (promiseOrValue instanceof Promise) {
    throw promiseOrValue
  }
  return [promiseOrValue, setAtom]
}