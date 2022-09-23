create table objects (
  id varchar(40) not null primary key,
  name text not null,
  size bigint not null,
  type varchar(255) not null,
  created_at timestamp(6) not null default current_timestamp(6),
  modified_at timestamp(6) not null default current_timestamp(6) on update current_timestamp(6)
);