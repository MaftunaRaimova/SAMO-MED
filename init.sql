create table SAMO (
 id serial primary key ,
 tg_id varchar unique,
 tg_firstname varchar,
 tg_username varchar default '',
 tg_number varchar default '',
 status varchar default ''
)