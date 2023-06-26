-- Create private bucket to store profile images and resume pdfs.
insert into storage.buckets (id, name) values ('images', 'images');
insert into storage.buckets (id, name) values ('resumes', 'resumes');
insert into storage.buckets (id, name) values ('experiences', 'experiences');