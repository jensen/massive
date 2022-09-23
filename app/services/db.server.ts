import { connect } from "@planetscale/database";

const config = {
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
};

export default function createClient() {
  return connect(config);
}

export const selectObjects = () => {
  return createClient()
    .execute(`select * from objects`)
    .then(({ rows }) =>
      rows.map((row) => {
        row.size = Number(row.size);
        return row;
      })
    );
};

export const createObject = ({
  id,
  name,
  size,
  type,
}: {
  id: string;
  name: string;
  size: number;
  type: string;
}) => {
  return createClient()
    .execute(`insert into objects (id, name, size, type) values (?, ?, ?, ?)`, [
      id,
      name,
      size,
      type,
    ])
    .then(({ rows }) => rows);
};
