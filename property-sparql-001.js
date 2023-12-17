/**
 * It looks like the initialBindings of PATH is ignored when it's not in the SELECT projection.
 * The commented line which includes PATH gives the expected result.
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
@prefix ex: <http://datashapes.org/sh/tests/sparql/property/sparql-001.test#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

ex:ValidCountry
    rdf:type ex:Country ;
    ex:germanLabel "Spanien"@de ;
.
  `)

  const query = `
#SELECT $this ?value $PATH WHERE {
SELECT $this ?value WHERE {
  $this $PATH ?value .
  FILTER (!isLiteral(?value) || !langMatches(lang(?value), "de"))
}
  `

  const bindingsFactory = new BindingsFactory(rdf)
  const initialBindings = bindingsFactory.bindings([
    [rdf.variable('this'), rdf.namedNode('http://datashapes.org/sh/tests/sparql/property/sparql-001.test#ValidCountry')],
    [rdf.variable('PATH'), rdf.namedNode('http://datashapes.org/sh/tests/sparql/property/sparql-001.test#germanLabel')]
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
