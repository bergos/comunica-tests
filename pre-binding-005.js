/**
 * It looks like the initialBindings of this is ignored by the bound function.
 */
import { BindingsFactory } from '@comunica/bindings-factory'
import { QueryEngine } from '@comunica/query-sparql-rdfjs'
import rdf from 'rdf-ext'
import DatasetStore from 'rdf-store-dataset'
import decode from 'stream-chunks/decode.js'

async function prettyJson (stream) {
  return JSON.stringify(JSON.parse(await decode(stream)), null, 2)
}

async function main () {
  const dataset = await rdf.io.dataset.fromText('text/turtle', `
@prefix ex: <http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-005.test#> .

ex:InvalidResource
  ex:property "Label" .
  `)

  const query = `
PREFIX ex: <http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-005.test#>

SELECT $this WHERE {
  {
    FILTER (bound($this))
  }
  $this ex:property "Label" .
  FILTER (bound($this)) .
}
  `

  const bindingsFactory = new BindingsFactory(rdf)
  const initialBindings = bindingsFactory.bindings([
    [rdf.variable('this'), rdf.namedNode('http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-005.test#InvalidResource')]
  ])

  const engine = new QueryEngine()
  const stream = await engine.query(query, {
    initialBindings,
    sources: [new DatasetStore({ dataset })]
  })

  const { data } = await engine.resultToString(stream, 'application/sparql-results+json')
  console.log(await prettyJson(data))
}

main()
