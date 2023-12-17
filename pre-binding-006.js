/**
 * It looks like the initialBindings of this is ignored when it's not matched against any triple.
 * .queryBindings behaves differently if the inner SELECT uses an explicit variable name in the projection.
 * An empty single line without any bound variables is returned in that case.
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
@prefix ex: <http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-006.test#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

ex:ValidResource1
  rdf:type rdfs:Resource .
  `)

  const query = `
PREFIX ex: <http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-006.test#>

SELECT $this WHERE {
  {
    #SELECT $this WHERE {
    SELECT * WHERE {
      FILTER ($this = ex:InvalidResource) .
    }
  }
}
  `

  const bindingsFactory = new BindingsFactory(rdf)
  const initialBindings = bindingsFactory.bindings([
    [rdf.variable('this'), rdf.namedNode('http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-006.test#InvalidResource')]
  ])

  const engine = new QueryEngine()
  const stream = await engine.query(query, {
    initialBindings,
    sources: [new DatasetStore({ dataset })]
  })

  const { data } = await engine.resultToString(stream, 'application/sparql-results+json')
  console.log(await prettyJson(data))

  const stream1 = await engine.queryBindings(query, {
    initialBindings,
    sources: [new DatasetStore({ dataset })]
  })

  for (const row of await stream1.toArray()) {
    console.log(row.toString())
  }
}

main()
