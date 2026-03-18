// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { unflattenObject } from '~/utils/lang-api.util'

describe('unflattenObject', () => {
  it('returns empty object for empty input', () => {
    expect(unflattenObject({}, '.')).toEqual({})
  })

  it('returns flat key directly when no separator present', () => {
    expect(unflattenObject({ hello: 'world' }, '.')).toEqual({ hello: 'world' })
  })

  it('handles multiple flat keys with no nesting', () => {
    expect(unflattenObject({ a: '1', b: '2', c: '3' }, '.')).toEqual({ a: '1', b: '2', c: '3' })
  })

  it('creates single-level nesting for one-separator key', () => {
    expect(unflattenObject({ 'a.b': 'v' }, '.')).toEqual({ a: { b: 'v' } })
  })

  it('creates deep nesting for multi-separator key', () => {
    expect(unflattenObject({ 'a.b.c': 'v' }, '.')).toEqual({ a: { b: { c: 'v' } } })
  })

  it('handles very deep nesting', () => {
    expect(unflattenObject({ 'a.b.c.d.e': 'deep' }, '.')).toEqual({
      a: { b: { c: { d: { e: 'deep' } } } },
    })
  })

  it('merges multiple keys at the same nesting level', () => {
    const result = unflattenObject({ 'a.b': '1', 'a.c': '2' }, '.')
    expect(result).toEqual({ a: { b: '1', c: '2' } })
  })

  it('merges keys across different top-level namespaces', () => {
    const result = unflattenObject({ 'a.b': '1', 'x.y': '2' }, '.')
    expect(result).toEqual({ a: { b: '1' }, x: { y: '2' } })
  })

  it('uses custom underscore separator', () => {
    expect(unflattenObject({ a_b: 'v' }, '_')).toEqual({ a: { b: 'v' } })
  })

  it('uses custom double-colon separator', () => {
    expect(unflattenObject({ 'ns::key': 'v' }, '::')).toEqual({ ns: { key: 'v' } })
  })

  it('overwrites non-object intermediate node with object when needed', () => {
    // 'a' is first set to 'scalar', then 'a.b' tries to nest under it — should become object
    const result = unflattenObject({ a: 'scalar', 'a.b': 'nested' }, '.')
    // 'a' gets replaced by an object because 'a.b' requires it
    expect(result.a).toEqual({ b: 'nested' })
  })

  it('handles keys where separator appears at different depths simultaneously', () => {
    const result = unflattenObject({
      'a.b.c': '1',
      'a.b.d': '2',
      'a.e': '3',
    }, '.')
    expect(result).toEqual({ a: { b: { c: '1', d: '2' }, e: '3' } })
  })

  it('preserves the value as-is (string passthrough)', () => {
    const result = unflattenObject({ 'greeting.hello': 'Bonjour le monde!' }, '.')
    expect(result.greeting.hello).toBe('Bonjour le monde!')
  })

  it('handles key with trailing separator gracefully', () => {
    // 'a.' splits to ['a', ''] — last empty string becomes the nested key
    const result = unflattenObject({ 'a.': 'v' }, '.')
    expect(result).toHaveProperty('a')
  })

  it('handles empty string value', () => {
    expect(unflattenObject({ 'a.b': '' }, '.')).toEqual({ a: { b: '' } })
  })
})
