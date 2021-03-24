# 🐉 dreki

[![npm version](https://img.shields.io/npm/v/dreki?color=gold&label=dreki%40npm)](https://www.npmjs.com/package/dreki)
[![npm license](https://img.shields.io/npm/l/dreki?color=blue)](./LICENSE.md)
[![CI](https://github.com/pyrbin/vang-temp-repo/actions/workflows/ci.yml/badge.svg)](https://github.com/pyrbin/vang-temp-repo/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dw/dreki)](https://www.npmjs.com/package/dreki)

An **[Entity-Component System](https://github.com/SanderMertens/ecs-faq)** (ecs) library written in Typescript.

## 🗺 Overview

The main goal of the library is to offer a **minimal**, **intuitive** & **modern** ecs with good performance.

The API is greatly inspired by **[bevy-ecs](https://github.com/bevyengine/bevy)**.

## 📚 Docs

_TODO_

## 📦 Packages

|                                                      |                                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **[dreki](packages/dreki/)**                         | Core **Entity-Component System** library                                                     |
| **[@dreki.land/3d](packages/3d/)** _(WIP)_           | A **3D plugin** created with [three.js](https://threejs.org/) & [rapier](https://rapier.rs/) |
| **[@dreki.land/collections](packages/collections/)** | Common data-structures used within **dreki**                                                 |
| **[@dreki.land/shared](packages/shared/)**           | Shared utilities (**types**, **functions** etc.) used within **dreki**                       |

<br>

See [README@dreki](packages/dreki/) for more details.

## 👷‍♂️ Developing

1. Install [pnpm](https://pnpm.js.org/en/).

   `npm i -g pnpm`

2. Install project dependencies.

   `pnpm i`

3. Build packages

   `pnpm build`

### 📝 Changelogs

The project uses [changesets](https://github.com/atlassian/changesets) for _version control_ & changelog generation.

> Read _[Using Changesets with pnpm](https://pnpm.js.org/using-changesets)_ before using changesets commands.

To create a new changelog, run `pnpm changeset` and follow the prompts.

### 🏷 Releases

The [Changesets GitHub action](https://github.com/changesets/action#with-publishing) will create and update a PR that applies changesets and publishes new versions of changed packages to npm when merged.

<br>

New packages that are scoped to `@dreki.land` has to initially be manually published by running this from the package directory:

`npm publish --access=publish`
