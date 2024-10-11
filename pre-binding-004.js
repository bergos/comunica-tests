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
@prefix dash: <http://datashapes.org/dash#> .
@prefix ex: <http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-004.test#> .
@prefix mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix sht: <http://www.w3.org/ns/shacl-test#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:
\tsh:declare [
\t\tsh:prefix "ex" ;
\t\tsh:namespace "http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-004.test#"^^xsd:anyURI ;
\t] .

ex:TestShape
  rdf:type sh:NodeShape ;
  rdfs:label "Test shape" ;
  sh:sparql ex:TestShape-sparql ;
  sh:targetNode ex:InvalidResource ;
.
ex:TestShape-sparql
  sh:prefixes ex: ;
  sh:select """
  \tSELECT $this
\tWHERE {
\t\tBIND ($this AS ?that) .
\t\tFILTER (?that = ex:InvalidResource) .
\t}""" ;
.
ex:ValidResource1
  rdf:type rdfs:Resource ;
.
<>
  rdf:type mf:Manifest ;
  mf:entries (
      <pre-binding-004>
    ) ;
.
<pre-binding-004>
  rdf:type sht:Validate ;
  rdfs:label "Test of pre-binding in BIND expressions" ;
  mf:action [
      sht:dataGraph <> ;
      sht:shapesGraph <> ;
    ] ;
  mf:result [
      rdf:type sh:ValidationReport ;
      sh:conforms "false"^^xsd:boolean ;
      sh:result [
          rdf:type sh:ValidationResult ;
          sh:focusNode ex:InvalidResource ;
          sh:resultSeverity sh:Violation ;
          sh:sourceConstraint ex:TestShape-sparql ;
          sh:sourceConstraintComponent sh:SPARQLConstraintComponent ;
          sh:sourceShape ex:TestShape ;
          sh:value ex:InvalidResource ;
        ] ;
    ] ;
  mf:status sht:approved ;
.`)

  const query = `
  PREFIX ex: <http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-004.test#>
  
  SELECT $this
\tWHERE {
\t\tBIND ($this AS ?that) .
\t\tFILTER (?that = ex:InvalidResource) .
\t}`

  const bindingsFactory = new BindingsFactory(rdf)
  const initialBindings = bindingsFactory.bindings([
    [rdf.variable('this'), rdf.namedNode('http://datashapes.org/sh/tests/sparql/pre-binding/pre-binding-004.test#InvalidResource')]
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
