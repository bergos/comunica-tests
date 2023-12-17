/**
 * It looks like the initialBindings of this is ignored when it's not matched against any triple.
 * I tried to use VALUES as a workaround, but that works only partially.
 * this never shows up in the result and VALUES only works in the multi-variable version.
 * See the alternative queries query1 and query2
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
@prefix ex: <http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-002.test#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

ex:ValidResource1
  rdf:type rdfs:Resource ;
.
  `)

  const query = `
PREFIX ex: <http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-002.test#>

SELECT $this WHERE {
  {

    FILTER (false) .
  } UNION {
    FILTER ($this = ex:InvalidResource) .
  }
}
  `

  const query1 = `
PREFIX ex: <http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-002.test#>

SELECT $this $that WHERE {
  {
    VALUES $that { "test1" }
    FILTER (false) .
  } UNION {
    VALUES $that { "test2" }
    FILTER ($this = ex:InvalidResource) .
  }
}
  `

  const query2 = `
PREFIX ex: <http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-002.test#>

SELECT $this $that WHERE {
  {
    VALUES ($that) { ("test1") }
    FILTER (false) .
  } UNION {
    VALUES ($that) { ("test2") }
    FILTER ($this = ex:InvalidResource) .
  }
}
  `

  const bindingsFactory = new BindingsFactory(rdf)
  const initialBindings = bindingsFactory.bindings([
    [rdf.variable('this'), rdf.namedNode('http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-002.test#InvalidResource')]
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
