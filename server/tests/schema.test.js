import test from 'node:test';
import assert from 'node:assert/strict';
import { contactSchema } from '../src/schema.js';

const example = { name: 'Example Client', email: 'client@example.org', organization: '', service: '', message: 'I would like a creative media campaign.', website: '', consent: true };
test('accepts valid inquiry', () => assert.equal(contactSchema.safeParse(example).success, true));
test('rejects invalid email', () => assert.equal(contactSchema.safeParse({...example, email:'bad'}).success, false));
test('requires explicit consent', () => assert.equal(contactSchema.safeParse({...example, consent:false}).success, false));
test('rejects unexpected fields', () => assert.equal(contactSchema.safeParse({...example, admin:true}).success, false));
test('rejects empty message', () => assert.equal(contactSchema.safeParse({...example, message:'hi'}).success, false));
