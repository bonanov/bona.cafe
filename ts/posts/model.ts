import { addHasReplyClass } from './../page/common';
import { Model } from "../base";
import { fileTypes, ImageData, PostData, PostLink, SmileReact } from "../common";
import { mine, page, posts } from "../state";
import { notifyAboutReply } from "../ui";
import Collection from "./collection";
import { sourcePath, thumbPath, blurPath } from "./images";
import PostView from "./view";

export interface Backlinks {
  [id: string]: PostBacklinks;
}
export interface PostBacklinks {
  [id: string]: number;
}

// Thread model, mirroring common.Thread.
// Just a stub yet, for usage in isomorphic templates.
export class Thread {
  public id: number;

  constructor(post: Post) {
    this.id = post.op;
  }
}

// Generic post model.
export class Post extends Model implements PostData {
  public collection: Collection;
  public view: PostView;
  public seenOnce: boolean;

  public time: number;
  public auth?: string;
  public userID?: string;
  public userName?: string;
  public userColor?: string;
  public body: string;
  public links?: PostLink[];
  public files?: ImageData[];
  public reacts?: SmileReact[];
  public backlinks: PostBacklinks;
  public op?: number;
  public board?: string;
  public sticky?: boolean;
  public deleted?: boolean;
  public subject?: string;

  constructor(attrs: PostData) {
    super();
    Object.assign(this, attrs);
    // this.reacts = this.reacts || []
  }

  public getFileByIndex(i: number): File {
    return new File(this.files[i]);
  }

  public getFileByHash(sha1: string): File {
    return new File(this.files.find((f) => f.SHA1 === sha1));
  }

  public isOP() {
    return this.id === this.op;
  }

  // Remove the model from its collection, detach all references and allow to
  // be garbage collected.
  public remove() {
    if (this.collection) {
      this.collection.remove(this);
    }
    if (this.view) {
      this.view.remove();
    }
  }

  // Check if this post replied to one of the user's posts and trigger
  // handlers. Set and render backlinks on any linked posts.
  public propagateLinks() {
    if (this.isReply()) {
      addHasReplyClass(this.view.el);
      notifyAboutReply(this);
    }
    if (this.links) {
      for (const [id] of this.links) {
        const post = posts.get(id);
        if (post) {
          post.insertBacklink(this.id, this.op);
        }
      }
    }
  }

  // Returns, if post is a reply to one of the user's posts or has '@everyone'
  public isReply() {
    if (this.isEveryone()) return true;
    if (!this.links) return false;
    for (const [id] of this.links) {
      if (mine.has(id)) {
        return true;
      }
    }
    return false;
  }

  // Returns, if post has '@everyone'
  public isEveryone() {
    return (/@everyone/).test(this.view.el.innerText);
  }

  // Insert data about another post linking this post into the model.
  public insertBacklink(id: number, op: number) {
    if (!this.backlinks) {
      this.backlinks = {};
    }
    this.backlinks[id] = op;
    this.view.renderBacklinks();
  }

  // Set post as deleted.
  public setDeleted() {
    if (this.isOP()) {
      if (page.thread) {
        location.href = "/all/";
      } else {
        posts.removeThread(this);
        this.view.removeThread();
      }
    } else {
      posts.remove(this);
      this.view.remove();
    }
  }

  public async setReaction(reaction: SmileReact) {
    setTimeout(() => {
      this.view.setReaction(reaction);
    }, 0);
  }

  // Returns, if this post has been seen already.
  public seen(): boolean {
    // Already seen, nothing to do.
    if (this.seenOnce) return true;

    // My posts are always seen.
    this.seenOnce = mine.has(this.id);
    if (this.seenOnce) return true;

    // Can't see because in inactive tab.
    if (document.hidden) return false;

    // Check if can see on the page.
    this.seenOnce = this.view.scrolledPast();
    if (this.seenOnce) return true;

    // Should be unseen then.
    return false;
  }
}

// Wrapper around image data with few useful methods.
export class File implements ImageData {
  public SHA1: string;
  public size: number;
  public video: boolean;
  public image: boolean;
  public audio: boolean;
  public apng: boolean;
  public fileType: fileTypes;
  public thumbType: fileTypes;
  public length?: number;
  public title?: string;
  public dims: [number, number, number, number];

  public get thumb(): string {
    return thumbPath(this.thumbType, this.SHA1);
  }

  public get src(): string {
    return sourcePath(this.fileType, this.SHA1);
  }

  public get blur(): string {
    return blurPath(this.thumbType, this.SHA1);
  }

  public get transparent(): boolean {
    return this.thumbType === fileTypes.png;
  }

  constructor(file: ImageData) {
    Object.assign(this, file);
  }
}
