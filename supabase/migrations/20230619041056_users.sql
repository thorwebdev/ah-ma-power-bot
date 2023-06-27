create table "public"."users" (
    "id" numeric not null,
    "created_at" timestamp with time zone default now(),
    "name" text,
    "age" smallint,
    "phone_number" text,
    "experience" text,
    "photo_path" text,
    step smallint not null default '0'::smallint,
    resume_html text,
    resume_markdown text,
    language text not null default 'en'::text
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";