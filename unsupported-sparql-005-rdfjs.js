/**
 * The result is empty but a row would be expected.
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
@prefix ex: <http://datashapes.org/sh/tests/sparql/pre-binding/unsupported-sparql-005.test#> .
@prefix mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix sht: <http://www.w3.org/ns/shacl-test#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<>
\trdf:type mf:Manifest ;
\tmf:entries ( <unsupported-sparql-005> ) .
    
<unsupported-sparql-005>
\trdf:type sht:Validate ;
\trdfs:label "Test of unsupported AS ?prebound" ;
\tmf:action [
\t\tsht:dataGraph <> ;
\t\tsht:shapesGraph <> ;
\t] ;
\tmf:result sht:Failure ;
\tmf:status sht:approved .

ex:TestShape
\ta sh:NodeShape ;
\tsh:targetNode ex:InvalidResource ;
\tsh:sparql [
\t\tsh:select """
\t\t\tSELECT $this
\t\t\tWHERE {
\t\t\t\tBIND (true AS $this) .
\t\t\t}""" ;
\t] .`)

  const query = `
SELECT $this
\t\t\tWHERE {
\t\t\t\tBIND (true AS $this) .
\t\t\t}`

  const bindingsFactory = new BindingsFactory(rdf)
  const initialBindings = bindingsFactory.bindings([
    [rdf.variable('this'), rdf.namedNode('http://datashapes.org/sh/tests/sparql/pre-binding/unsupported-sparql-005.test#InvalidResource')]
  ])

  const engine = new QueryEngine()
  const stream = await engine.queryBindings(query, {
    sources: [new DatasetStore({ dataset })],
    initialBindings
  })

  const rows = await stream.toArray()

  console.log(`rows: ${rows.length}`)
}

main()
