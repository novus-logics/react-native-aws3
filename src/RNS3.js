/**
 * RNS3
 */

import { Request } from './Request'
import { S3Policy } from './S3Policy'

const AWS_DEFAULT_S3_HOST = 's3.amazonaws.com'

const EXPECTED_RESPONSE_KEY_VALUE_RE = {
  key: /<Key>(.*)<\/Key>/,
  etag: /<ETag>"?([^"]*)"?<\/ETag>/,
  bucket: /<Bucket>(.*)<\/Bucket>/,
  location: /<Location>(.*)<\/Location>/,
}

const extractResponseValues = (responseText) => {
  return null == responseText ? null : Object.keys(
    EXPECTED_RESPONSE_KEY_VALUE_RE)
    .reduce((result, key) => {
      let match = responseText.match(EXPECTED_RESPONSE_KEY_VALUE_RE[key]);
      return Object.assign(result, { [key]: match && match[1] });
    }, {});
}

const setBodyAsParsedXML = (response) => {
  return Object.assign(
    response,
    { body: { postResponse: extractResponseValues(response.text) } },
  );
}

const setBodyAsParsedXML = (response) =>
  ({
    ...response,
    body: { postResponse: response.text == null ? null : extractResponseValues(response.text) }
  })

export class RNS3 {
  static put(file, options) {
    options = {
      ...options,
      key: (options.keyPrefix || '') + file.name,
      contentType: file.type,
    });

    // data URL?
    const dataUrlRegex = /^data:\w+\/\w+;base64,/;
    if (dataUrlRegex.test(file.uri)) {
      file = file.uri.replace(dataUrlRegex, '');
      options.contentEncoding = 'base64';
    }

    let url = `https://${ options.bucket }.${options.awsUrl || 's3.amazonaws.com'}`;
    let method = "POST";
    let policy = S3Policy.generate(options);

    return Request.create(url, method, policy)
      .set("file", file)
      .send()
      .then(setBodyAsParsedXML)
  }
}
