export interface SeedUpsertOptions {
  upsert: true;
  new: true;
  runValidators: true;
  setDefaultsOnInsert: true;
}

export interface SeedUpsertUpdate {
  $set: Record<string, unknown>;
  $unset?: Record<string, ''>;
}

export type SeedUpsertWriter<TDocument> = (
  filter: Record<string, unknown>,
  update: SeedUpsertUpdate,
  options: SeedUpsertOptions
) => PromiseLike<TDocument | null>;

const UPSERT_OPTIONS: SeedUpsertOptions = {
  upsert: true,
  new: true,
  runValidators: true,
  setDefaultsOnInsert: true,
};

async function syncRecords<TSeed extends object, TDocument>(
  records: readonly TSeed[],
  write: SeedUpsertWriter<TDocument>,
  naturalKey: (record: TSeed) => Record<string, unknown>,
  toDocument: (record: TSeed) => Record<string, unknown>
): Promise<TDocument[]> {
  const synchronized: TDocument[] = [];

  for (const record of records) {
    const values = toDocument(record);
    const setValues: Record<string, unknown> = {};
    const unsetValues: Record<string, ''> = {};

    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) {
        unsetValues[key] = '';
      } else {
        setValues[key] = value;
      }
    }

    const update: SeedUpsertUpdate = { $set: setValues };
    if (Object.keys(unsetValues).length > 0) {
      update.$unset = unsetValues;
    }

    const document = await write(
      naturalKey(record),
      update,
      UPSERT_OPTIONS
    );

    if (!document) {
      throw new Error('Seed upsert did not return a document');
    }

    synchronized.push(document);
  }

  return synchronized;
}

export function syncDepartments<TSeed extends { code: string }, TDocument>(
  records: readonly TSeed[],
  write: SeedUpsertWriter<TDocument>
): Promise<TDocument[]> {
  return syncRecords(
    records,
    write,
    (record) => ({ code: record.code }),
    (record) => ({ ...record })
  );
}

export function syncOfficialCourses<TSeed extends { code: string }, TDocument>(
  records: readonly TSeed[],
  write: SeedUpsertWriter<TDocument>
): Promise<TDocument[]> {
  return syncRecords(
    records,
    write,
    (record) => ({ code: record.code, createdBy: null }),
    (record) => ({ ...record, createdBy: null })
  );
}

export function syncRequirements<
  TSeed extends { department: unknown; name: string },
  TDocument,
>(
  records: readonly TSeed[],
  write: SeedUpsertWriter<TDocument>
): Promise<TDocument[]> {
  return syncRecords(
    records,
    write,
    (record) => ({
      department: record.department,
      name: record.name,
    }),
    (record) => ({ ...record })
  );
}

export function syncAcademicEvents<
  TSeed extends { title: string; startDate: Date; endDate?: Date },
  TDocument,
>(
  records: readonly TSeed[],
  write: SeedUpsertWriter<TDocument>
): Promise<TDocument[]> {
  return syncRecords(
    records,
    write,
    (record) => ({
      title: record.title,
      startDate: record.startDate,
      createdBy: null,
    }),
    (record) => ({ ...record, endDate: record.endDate, createdBy: null })
  );
}
