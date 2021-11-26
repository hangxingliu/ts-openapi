import { OpenApiTagObject } from "./types";

export class OpenApiTagsManager {
  private readonly tags = new Map<string, OpenApiTagObject>();

  add(...tags: Array<string | OpenApiTagObject>) {
    for (let i = 0; i < tags.length; i++) {
      const _tag = tags[i];
      const tag: OpenApiTagObject = { name: '' };
      if (typeof _tag === 'string') {
        tag.name = _tag;
      } else if (_tag && typeof _tag?.['name'] === 'string') {
        tag.name = _tag['name'];
        if (!tag.name) continue;
        if (_tag['description']) tag.description = _tag['description'];
        if (_tag['externalDocs']) tag.externalDocs = _tag['externalDocs'];
      }
      this.tags.set(tag.name, tag);
    }
  }
  getAllTags() {
    return Array.from(this.tags.values())
  }
}
