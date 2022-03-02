const db = require('../../data/db-config');

const findAll = async () => {
  // return await db('assignments');

  const mentees = await db
    // select all ('*') here is more than necessary, but was left for now under the assumption that some profile information that does not yet exist will eventually (e.g. interests, tech stack, etc). can be pared down as necessary once the profile information gets solidified
    .select('*')
    .from('profiles as p')
    .where('p.role_id', '=', '4');

  const assignments = await db
    .select('a.mentor_id', 'a.mentee_id', 'p.first_name', 'p.last_name')
    .from('assignments as a')
    .join('profiles as p', 'p.profile_id', 'a.mentee_id');

  // test comment
  for (let i = 0; i < mentees.length; i++) {
    mentees[i]['mentors'] = [];

    // for (let j = 0; j < assignments.length; j++) {
    //   if (assignments[j]['mentee_id'] === mentees[i]['profile_id']) {
    //     mentees[i]['mentors'].push({
    //       profile_id: assignments[j]['mentee_id'],
    //       first_name: assignments[j]['first_name'],
    //       last_name: assignments[j]['last_name'],
    //     });
    //   }
    // }
    // for (let m of assignments) {
    //   if (m.mentee_id === mentees[i]['profile_id']) {
    //   }
  }

  // .select(
  //   // 'a.assignment_id',
  //   'a.mentee_id',
  //   'p.email',
  //   'p.first_name',
  //   'p.last_name',
  //   'p.role_id',
  //   'p.profile_id'
  // )
  // .from('profiles as p')
  // .where('p.role_id', '=', '4')
  // .leftJoin('assignments as a', 'p.profile_id', '=', 'a.mentee_id');

  console.log(mentees);
  console.log(assignments);

  return mentees;
};

const findById = async (assignment_id) => {
  return db.select('*').from('assignments').where({ assignment_id }).first();
};

function findByMentorId(id) {
  return db
    .select(
      'a.assignment_id',
      'a.mentee_id',
      'p.email',
      'p.first_name',
      'p.last_name',
      'p.role_id',
      'p.created_at',
      'p.pending'
    )
    .from('assignments as a')
    .join('profiles as p', 'p.profile_id', '=', 'a.mentee_id')
    .where({ mentor_id: id });
}

function findByMenteeId(id) {
  return db
    .select(
      'a.assignment_id',
      'a.mentor_id',
      'p.email',
      'p.first_name',
      'p.last_name',
      'p.role_id',
      'p.created_at',
      'p.pending'
    )
    .from('assignments as a')
    .join('profiles as p', 'p.profile_id', '=', 'a.mentor_id')
    .where({ mentee_id: id });
}
async function Create(assign) {
  const newAssign = await db('assignments').insert(assign);
  return newAssign;
}

function Update(assignment_id, changes) {
  return db('assignments').where({ assignment_id }).update(changes);
}

function Remove(assignment_id) {
  return db('assignments').where({ assignment_id }).del();
}

module.exports = {
  findAll,
  findById,
  findByMentorId,
  findByMenteeId,
  Create,
  Update,
  Remove,
};
