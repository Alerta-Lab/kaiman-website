import { describe, expect, it } from 'vitest';
import { buildWordPreview, fieldMappingIssue, splitWordBlocks } from './ai-word-import';
import { postInputSchema } from '../features/posts/post.schema';

describe('Word AI mapping', () => {
 const blocks=splitWordBlocks('# Batch\n\nTITLE:\n\nEnglish title\n\nEnglish paragraph.\n\nVERSIÓN EN ESPAÑOL\n\nTítulo español\n\nPárrafo español.\n\nPrompt de imagen');
 const structure={topics:[{label:'Tema',versions:[{locale:'en',start:1,end:3},{locale:'es',start:4,end:7}]}]};
 const fields=[{fields:[{field:'title',blocks:[1]}],labels:[0]},{fields:[{field:'title',blocks:[1]},{field:'bodyPrompt',blocks:[3]}],labels:[0]}];
 it('copies original content into separate versions and exposes excluded blocks',()=>{const x=buildWordPreview(blocks,structure,fields);expect(x.topics[0].versions.map(v=>v.locale)).toEqual(['en','es']);expect(x.topics[0].versions[0].markdown).toBe('English paragraph.');expect(x.topics[0].versions[1].markdown).toContain('Párrafo español.');expect(x.topics[0].versions[1].markdown).toContain('[IMAGEN_INTERIOR]');expect(x.excludedBlocks).toContain('# Batch')});
 it('rejects overlapping languages and ambiguous fields',()=>{expect(()=>buildWordPreview(blocks,{topics:[{label:'x',versions:[{locale:'en',start:1,end:4},{locale:'es',start:4,end:7}]}]},fields)).toThrow();expect(()=>buildWordPreview(blocks,structure,[{fields:[{field:'title',blocks:[1]},{field:'slug',blocks:[1]}],labels:[]},fields[1]])).toThrow()});
 it('detects conflicting mappings while accepting repeated identical assignments',()=>{
  expect(fieldMappingIssue({fields:[{field:'title',blocks:[1,1]}],labels:[]},3)).toBeNull();
  expect(fieldMappingIssue({fields:[{field:'title',blocks:[1]},{field:'slug',blocks:[1]}],labels:[]},3)).toContain('Block 1');
 });
 it('keeps a metadata value when AI selects its label instead',()=>{
  const input=splitWordBlocks('Title:\n\nA real title\n\nBody text with enough content.');
  const x=buildWordPreview(input,{topics:[{label:'A',versions:[{locale:'en',start:0,end:2}]}]},[{fields:[{field:'title',blocks:[0]}],labels:[0]}]);
  expect(x.topics[0].versions[0].title).toBe('A real title');
  expect(x.topics[0].versions[0].markdown).toContain('Body text');
 });
 it('removes metadata labels even if AI does not list them, while preserving editorial text',()=>{
  const input=splitWordBlocks('__TITLE:__\n\nA real title\n\n__KEY TAKEAWAY:__\n\nThe original editorial paragraph.');
  const x=buildWordPreview(input,{topics:[{label:'A',versions:[{locale:'en',start:0,end:3}]}]},[{fields:[{field:'title',blocks:[1]}],labels:[]}]);
  expect(x.topics[0].versions[0].markdown).not.toContain('__TITLE:__');
  expect(x.topics[0].versions[0].markdown).not.toContain('__KEY TAKEAWAY:__');
  expect(x.excludedBlocks).toContain('__KEY TAKEAWAY:__');
  expect(x.topics[0].versions[0].markdown).toContain('The original editorial paragraph.');
  expect(x.excludedBlocks).toContain('__TITLE:__');
 });
 it('accepts long article titles and excerpts without truncating them',()=>{
  const input={title:'Título '.repeat(30),slug:'un-articulo',excerpt:'Resumen '.repeat(60),markdown:'Contenido suficiente para la prueba.',status:'draft',locale:'es',seoTitle:'Título SEO',seoDescription:'Descripción suficiente para el artículo.',tags:[]};
  const parsed=postInputSchema.parse(input);
  expect(parsed.title).toBe(input.title.trim());
  expect(parsed.excerpt).toBe(input.excerpt.trim());
 });
 it('preserves closing CTA structure for rendering after import',()=>{
  const input=splitWordBlocks('__CLOSING CTA — HOOK LINE:__\n\nUna invitación.\n\n__CLOSING CTA — HEADLINE:__\n\nEl siguiente paso.');
  const x=buildWordPreview(input,{topics:[{label:'A',versions:[{locale:'es',start:0,end:3}]}]},[{fields:[],labels:[]}]);
  expect(x.topics[0].versions[0].markdown).toContain('<!-- kaiman:cta-hook-line -->');
  expect(x.topics[0].versions[0].markdown).toContain('<!-- kaiman:cta-headline -->');
 });
});
