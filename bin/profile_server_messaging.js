/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// This MUST be the first require in the program.
// Only `require()` the newrelic module if explicity enabled.
// If required, modules will be instrumented.
require('../lib/newrelic')()

var config = require('../config').getProperties()
var log = require('../lib/log')(config.log.level, 'profile-server-messaging')
var clients = require('../lib/clients')
var error = require('../lib/error')
var Token = require('../lib/tokens')(log, config)
var SQSReceiver = require('../lib/sqs')(log)
var profileUpdates = require('../lib/profile/updates')(log)
var push = require('../lib/push')

var DB = require('../lib/db')(
  config,
  log,
  error,
  Token.SessionToken,
  Token.KeyFetchToken,
  Token.AccountResetToken,
  Token.PasswordForgotToken,
  Token.PasswordChangeToken
)

var profileUpdatesQueue = new SQSReceiver(config.profileServerMessaging.region, [
  config.profileServerMessaging.profileUpdatesQueueUrl
])

DB.connect(config[config.db.backend])
  .then(
    function (db) {
      profileUpdates(profileUpdatesQueue, push(log, db, config), clients(log, db, config))
    }
  )
