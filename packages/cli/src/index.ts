#!/usr/bin/env bun
import { program } from "commander"
import { ingestCmd } from "./commands/ingest"
import { spotsCmd } from "./commands/spots"
import { queryCmd } from "./commands/query"

const API_URL = process.env.DAWN_PATROL_API ?? "http://localhost:3220"

program
  .name("dawn-patrol")
  .description("CLI for the Dawn Patrol forecast aggregator")
  .version("0.0.1")

program.addCommand(ingestCmd(API_URL))
program.addCommand(spotsCmd(API_URL))
program.addCommand(queryCmd(API_URL))

program.parse()
