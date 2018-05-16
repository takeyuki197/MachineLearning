# docker build -t my-postgres .
# docker run -p 5432:5432 --name my-postgres_1 --volumes-from dbdata my-postgres -c config_file=/etc/postgresql/postgresql.conf
FROM postgres

COPY ./postgresql.conf /etc/postgresql/

ENV POSTGRES_PASSWORD=test

EXPOSE 5432

CMD ["postgres"]