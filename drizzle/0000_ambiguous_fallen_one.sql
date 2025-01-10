CREATE TABLE "images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"url" text,
	"meta" text,
	"userId" text,
	CONSTRAINT "images_id_unique" UNIQUE("id")
);
