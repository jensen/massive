# Massive Uploader

This project provides an example to those who want to build multipart, resumable uploads using S3 or a compatible API.

## Demo

https://user-images.githubusercontent.com/14803/203409917-e7b17bab-307b-4d75-b9d0-7501d2289791.mp4

## Tech

- S3 or compatible API
- Remix
- Prisma w/ sqlite

**Remix**

Remix is not required to make this work. We could use an express server or Next.js instead. The requirement is to run code in an environment that protects our secret credentials.

**S3 API**

> Individual Amazon S3 objects can range in size from a minimum of 0 bytes to a maximum of 5 TB. The largest object we can upload in a single PUT is 5 GB. For objects larger than 100 MB, customers should consider using the Multipart Upload capability.

We can upload massive files to S3, but if we want to upload anything over 5GB, we will need to break it up into parts.

We can use a few options to interact with an S3 API.

- [AWS SDK v2](https://github.com/aws/aws-sdk-js)
- [AWS SDK v3](https://github.com/aws/aws-sdk-js-v3)

Version 3 is multiple packages under the `@aws-sdk` namespace. This project uses `"@aws-sdk/client-s3"` and `"@aws-sdk/s3-request-presigner"`.

**Prisma w/sqlite**

Although we have an API that allows us to read information about the objects we upload, we might want to store additional information. A database will enable us to do quick queries for the metadata of all of our files.

## The Project

A few abstractions exist to upload files to an S3-compatible API.

- [https://uppy.io/](https://uppy.io/)
- [https://github.com/TTLabs/EvaporateJS](https://github.com/TTLabs/EvaporateJS)

While these provide pretty robust solutions, it can be helpful to look at how they work under the hood—this section overviews how the pieces work together to give a similar result.

### Highlights

- The browser has two common API for making requests using JavaScript. We can use `fetch` or `XMLHttpRequest` to upload our objects to the S3 server. One interesting difference is how we handle the progress of the upload. With `XMLHttpRequest` we can register an event listener that allows us to keep track of the upload progress.
- When we store the size of our object in the database, we use a BigInt. Our files can be up to 5TB.
- Multiple parts of a file are stored on the S3 server as the user uploads them. We can request the existing multipart uploads and parts using the S3 API. We can mark the file as complete when we upload all of the parts. The S3 service combines the parts and makes them available as a single download.

### Requests

In most cases, it makes more sense to use the `fetch` API over the much older `XMLHttpRequest` API. When we want to track the progress of an upload, we should use the older API; it allows us to listen to a `progress` event. The project example is simplified, but we can find details of the entire interface on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/progress_event).

```javascript
const request = new XMLHttpRequest();

request.open("put", url, true);

request.upload.onprogress = (event) => {
  /* access to event.loaded, event.total and event.lengthComputable */
};

request.send(data);
```

### BigInt

Storing our object metadata in a database requires some consideration for the types we use. Storing the size of a file in bytes so that we can quickly calculate the total size requires us to consider the maximum size of the data type we use. Using a regular 32-bit integer, we can only represent values up to around 2GB. We know that the maximum size of our S3 files is 5TB.

When we use JavaScript numbers, we can store much larger values. In our case, the maximum size of an object that we can store on S3 is much lower than the limit of a JavaScript number or an SQLite bigint.

```
            2_147_483_647 - Maximum value of an integer in SQLite
        5_497_558_138_880 - Maximum size of an S3 object in bytes
    9_007_199_254_740_992 - Maximum safe value of a JavaScript number
9_223_372_036_854_775_807 - Maximum value of a bigint in SQLite
```

### Multiple Parts

We benefit in a few ways from using a multipart upload strategy.

- We can surpass the 5GB limit of a single `PUT` request
- We can resume a large upload without losing a lot of progress in case of a network error

We can use the API to get the current status of the multipart uploads in our bucket. The API will return no results unless we have an unfinished multipart upload. A process that cleans out old and incomplete multipart uploads may be necessary for a production product.

![View of the multipart upload list page](https://user-images.githubusercontent.com/14803/203862847-8aa61d2c-ed94-4906-945c-61f1f94288be.png)

### CORS

We presign a URL and provide that to the client for direct upload. The S3 server implements CORS, but we can configure the ruleset. In the example before, we allow both the development server and the production server to access the bucket.

![View of the cors page](https://user-images.githubusercontent.com/14803/203873275-d7219d8b-c302-461b-9871-be2e03fc3287.png)

Separating the development and production buckets is recommended but unnecessary for this demonstration.

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

If you've followed the setup instructions already, all you need to do is run this:

```sh
npm run deploy
```

You can run `flyctl info` to get the url and ip address of your server.

Check out the [fly docs](https://fly.io/docs/getting-started/node/) for more information.
