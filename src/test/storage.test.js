import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_PORTS, getPorts, savePorts } from '../lib/storage.js'

test('ports default to common developer servers when unset or saved empty', async () => {
  const initial = await getPorts()

  assert.deepEqual(initial.ports.map((port) => port.port), [5173, 3000, 5174, 4200, 8080, 8000, 5000])
  assert.deepEqual(initial.ports.map((port) => port.protocol), DEFAULT_PORTS.map(() => 'http'))
  assert.notEqual(initial.ports[0], DEFAULT_PORTS[0])

  await savePorts([])
  const savedEmpty = await getPorts()

  assert.deepEqual(savedEmpty.ports.map((port) => port.port), [5173, 3000, 5174, 4200, 8080, 8000, 5000])
})
