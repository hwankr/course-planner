import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

type StoredDocument = Record<string, unknown> & { _id: string };

interface UpsertCall {
  filter: Record<string, unknown>;
  update: {
    $set: Record<string, unknown>;
    $unset?: Record<string, unknown>;
  };
  options: { upsert: boolean };
}

function valuesEqual(left: unknown, right: unknown): boolean {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime();
  }

  return Object.is(left, right);
}

function createInMemoryCollection(initial: StoredDocument[]) {
  const documents = initial.map((document) => ({ ...document }));
  const calls: UpsertCall[] = [];
  const indexes = ['_id_', 'code_1_createdBy_1'];

  return {
    documents,
    indexes,
    calls,
    async findOneAndUpdate(
      filter: Record<string, unknown>,
      update: {
        $set: Record<string, unknown>;
        $unset?: Record<string, unknown>;
      },
      options: { upsert: boolean }
    ) {
      calls.push({ filter, update, options });
      const existing = documents.find((document) =>
        Object.entries(filter).every(([key, value]) => valuesEqual(document[key], value))
      );

      if (existing) {
        Object.assign(
          existing,
          Object.fromEntries(
            Object.entries(update.$set).filter(([, value]) => value !== undefined)
          )
        );
        for (const key of Object.keys(update.$unset ?? {})) {
          delete existing[key];
        }
        return existing;
      }

      if (options.upsert !== true) {
        return null;
      }

      const inserted = {
        _id: `seed-${documents.length + 1}`,
        ...Object.fromEntries(
          Object.entries(update.$set).filter(([, value]) => value !== undefined)
        ),
      } satisfies StoredDocument;
      documents.push(inserted);
      return inserted;
    },
  };
}

async function loadSeedOperations() {
  try {
    return await import('../scripts/seed-operations');
  } catch (error) {
    assert.fail(`production seed operations helper is unavailable: ${String(error)}`);
  }
}

test('official course synchronization is idempotent and preserves custom records and indexes', async () => {
  const { syncOfficialCourses } = await loadSeedOperations();
  const collection = createInMemoryCollection([
    { _id: 'unrelated', code: 'OTHER100', createdBy: null, name: 'Unrelated' },
    { _id: 'custom', code: 'SWE100', createdBy: 'user-1', name: 'Custom copy' },
  ]);
  const originalIndexes = [...collection.indexes];

  await syncOfficialCourses(
    [{ code: 'SWE100', name: 'Original name', credits: 3 }],
    collection.findOneAndUpdate
  );
  await syncOfficialCourses(
    [{ code: 'SWE100', name: 'Updated name', credits: 3 }],
    collection.findOneAndUpdate
  );

  assert.equal(collection.documents.length, 3);
  assert.equal(
    collection.documents.find(
      (document) => document.code === 'SWE100' && document.createdBy === null
    )?.name,
    'Updated name'
  );
  assert.equal(
    collection.documents.find((document) => document._id === 'custom')?.name,
    'Custom copy'
  );
  assert.equal(collection.documents.find((document) => document._id === 'unrelated')?.name, 'Unrelated');
  assert.deepEqual(collection.indexes, originalIndexes);
  assert.equal(collection.calls.length, 2);
  assert.ok(collection.calls.every((call) => call.options.upsert === true));
});

test('department synchronization keys records by code', async () => {
  const { syncDepartments } = await loadSeedOperations();
  assert.equal(typeof syncDepartments, 'function');
  const collection = createInMemoryCollection([
    { _id: 'unrelated', code: 'GEN', name: 'General Studies' },
  ]);

  await syncDepartments(
    [{ code: 'SWE', name: 'Software Engineering' }],
    collection.findOneAndUpdate
  );
  await syncDepartments(
    [{ code: 'SWE', name: 'Updated Software Engineering' }],
    collection.findOneAndUpdate
  );

  assert.equal(collection.documents.length, 2);
  assert.equal(
    collection.documents.find((document) => document.code === 'SWE')?.name,
    'Updated Software Engineering'
  );
  assert.equal(collection.documents.find((document) => document.code === 'GEN')?.name, 'General Studies');
  assert.deepEqual(collection.calls.map((call) => call.filter), [
    { code: 'SWE' },
    { code: 'SWE' },
  ]);
});

test('requirement synchronization keys records by department and name', async () => {
  const { syncRequirements } = await loadSeedOperations();
  assert.equal(typeof syncRequirements, 'function');
  const collection = createInMemoryCollection([
    {
      _id: 'same-category-other-name',
      department: 'swe-dept',
      category: 'major_required',
      name: 'Keep named requirement',
    },
    {
      _id: 'other-department',
      department: 'gen-dept',
      category: 'major_required',
      name: 'Seeded requirement',
    },
  ]);

  await syncRequirements(
    [{ department: 'swe-dept', category: 'major_required', name: 'Seeded requirement' }],
    collection.findOneAndUpdate
  );
  await syncRequirements(
    [{ department: 'swe-dept', category: 'major_elective', name: 'Seeded requirement' }],
    collection.findOneAndUpdate
  );

  assert.equal(collection.documents.length, 3);
  assert.equal(
    collection.documents.find(
      (document) =>
        document.department === 'swe-dept' && document.name === 'Seeded requirement'
    )?.category,
    'major_elective'
  );
  assert.equal(
    collection.documents.find((document) => document._id === 'same-category-other-name')?.name,
    'Keep named requirement'
  );
  assert.equal(collection.documents.find((document) => document._id === 'other-department')?.name, 'Seeded requirement');
  assert.deepEqual(collection.calls.map((call) => call.filter), [
    { department: 'swe-dept', name: 'Seeded requirement' },
    { department: 'swe-dept', name: 'Seeded requirement' },
  ]);
});

test('academic event synchronization keys records by title and start date', async () => {
  const { syncAcademicEvents } = await loadSeedOperations();
  assert.equal(typeof syncAcademicEvents, 'function');
  const collection = createInMemoryCollection([
    {
      _id: 'same-title-other-date',
      title: 'Course registration',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      category: 'registration',
    },
    {
      _id: 'unrelated',
      title: 'Unrelated event',
      startDate: new Date('2026-08-11T00:00:00.000Z'),
      category: 'academic',
    },
  ]);

  await syncAcademicEvents(
    [
      {
        title: 'Course registration',
        startDate: new Date('2026-08-11T00:00:00.000Z'),
        category: 'registration',
      },
    ],
    collection.findOneAndUpdate
  );
  await syncAcademicEvents(
    [
      {
        title: 'Course registration',
        startDate: new Date('2026-08-11T00:00:00.000Z'),
        category: 'academic',
      },
    ],
    collection.findOneAndUpdate
  );

  assert.equal(collection.documents.length, 3);
  assert.equal(
    collection.documents.find(
      (document) =>
        document.title === 'Course registration' &&
        valuesEqual(document.startDate, new Date('2026-08-11T00:00:00.000Z'))
    )?.category,
    'academic'
  );
  assert.equal(
    collection.documents.find((document) => document._id === 'same-title-other-date')?.category,
    'registration'
  );
  assert.equal(collection.documents.find((document) => document._id === 'unrelated')?.title, 'Unrelated event');
  assert.ok(
    collection.calls.every(
      (call) =>
        call.filter.title === 'Course registration' &&
        valuesEqual(call.filter.startDate, new Date('2026-08-11T00:00:00.000Z'))
    )
  );
});

test('academic event synchronization preserves a user event with the same title and date', async () => {
  const { syncAcademicEvents } = await loadSeedOperations();
  const startDate = new Date('2026-08-11T00:00:00.000Z');
  const collection = createInMemoryCollection([
    {
      _id: 'user-event',
      title: 'Course registration',
      startDate,
      category: 'other',
      createdBy: 'user-1',
    },
  ]);

  await syncAcademicEvents(
    [{ title: 'Course registration', startDate, category: 'registration' }],
    collection.findOneAndUpdate
  );
  await syncAcademicEvents(
    [{ title: 'Course registration', startDate, category: 'academic' }],
    collection.findOneAndUpdate
  );

  assert.equal(collection.documents.length, 2);
  assert.equal(collection.documents.find((document) => document._id === 'user-event')?.category, 'other');
  assert.equal(
    collection.documents.find((document) => document.createdBy === null)?.category,
    'academic'
  );
  assert.ok(collection.calls.every((call) => call.filter.createdBy === null));
});

test('academic event synchronization unsets an end date omitted by the current seed', async () => {
  const { syncAcademicEvents } = await loadSeedOperations();
  const startDate = new Date('2026-08-11T00:00:00.000Z');
  const collection = createInMemoryCollection([
    {
      _id: 'seed-event',
      title: 'Course registration',
      startDate,
      endDate: new Date('2026-08-13T00:00:00.000Z'),
      category: 'registration',
      createdBy: null,
    },
  ]);

  await syncAcademicEvents(
    [{ title: 'Course registration', startDate, category: 'registration' }],
    collection.findOneAndUpdate
  );

  const synchronized = collection.documents.find((document) => document._id === 'seed-event');
  assert.equal(Object.hasOwn(synchronized ?? {}, 'endDate'), false);
  assert.deepEqual(collection.calls[0]?.update.$unset, { endDate: '' });
});

test('seed entry points contain no collection drops or collection-wide deletions', async () => {
  const sources = await Promise.all([
    readFile(new URL('../scripts/seed.ts', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/seed-academic-events.ts', import.meta.url), 'utf8'),
  ]);

  for (const source of sources) {
    assert.doesNotMatch(source, /\bdropCollection\s*\(/);
    assert.doesNotMatch(source, /\bdeleteMany\s*\(\s*\{\s*\}\s*\)/);
  }
});

test('seed entry points delegate every seeded entity to the tested upsert synchronizers', async () => {
  const [seedSource, eventSource] = await Promise.all([
    readFile(new URL('../scripts/seed.ts', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/seed-academic-events.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(seedSource, /await syncDepartments\s*\(/);
  assert.match(seedSource, /await syncOfficialCourses\s*\(/);
  assert.match(seedSource, /await syncRequirements\s*\(/);
  assert.doesNotMatch(seedSource, /\b(?:Department|Course|Requirement)\.create\s*\(/);

  assert.match(eventSource, /await syncAcademicEvents\s*\(/);
  assert.doesNotMatch(eventSource, /\bAcademicEvent\.insertMany\s*\(/);
});
