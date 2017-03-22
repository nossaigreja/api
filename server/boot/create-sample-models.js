'use strict';

require('rootpath')();
//Cria o objeto de auxilo ao trabalho de migração de dados
//var MigrateExtras = require('server/samples/db-migrate/util/migrate-extras.js');

module.exports = function (app) {

  app.dataSources.db.automigrate('Physician', function (err) {
    if (err) throw err;

    app.models.Physician.create([
      {
        name: 'Physician - Bel Cafe'
      }
    ], function (err, physicians) {
      if (err) throw err;

      console.log('Models created: \n', physicians);
    });
  });

  app.dataSources.db.automigrate('Patient', function (err) {
    if (err) throw err;

    app.models.Patient.create([
      {
        name: 'Patient - Bel Cafe'
      }
    ], function (err, patients) {
      if (err) throw err;

      console.log('Models created: \n', patients);
    });
  });

  app.dataSources.db.automigrate('Appointment', function (err) {
    if (err) throw err;

    app.models.Appointment.create([
      {
        physicianId: 1,
        patientId: 1,
        appointmentDate: new Date()
      }, {
        physicianId: 1,
        patientId: 1,
        appointmentDate: new Date()
      }, {
        physicianId: 1,
        patientId: 1,
        appointmentDate: new Date()
      },
    ], function (err, appointments) {
      if (err) throw err;

      console.log('Models created: \n', appointments);
    });
  });
};