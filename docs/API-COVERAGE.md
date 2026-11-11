# API coverage

Generated from the pinned public OpenAPI files in `sources/`. The n8n package exposes 78 Data, Sequences and Tasks operations. The three Analytics operations are experimental and excluded from the package. List/search operations return individual records. No polling or webhook triggers are included.

| API | Operation | Method | Path |
| --- | --- | --- | --- |
| data | Create Event Query Job | POST | `/data/v1/events/query-jobs` |
| data | List Event Query Jobs | GET | `/data/v1/events/query-jobs` |
| data | Get Event Query Job | GET | `/data/v1/events/query-jobs/{job_id}` |
| data | Cancel Event Query Job | POST | `/data/v1/events/query-jobs/{job_id}/cancel` |
| data | Get Event Query Job Results | GET | `/data/v1/events/query-jobs/{job_id}/results` |
| data | List Lists | GET | `/data/v1/lists` |
| data | Create List | POST | `/data/v1/lists` |
| data | Get List | GET | `/data/v1/lists/{list_id}` |
| data | Update List | PATCH | `/data/v1/lists/{list_id}` |
| data | Delete List | DELETE | `/data/v1/lists/{list_id}` |
| data | List List Entries | GET | `/data/v1/lists/{list_id}/entries` |
| data | Add List Entries | POST | `/data/v1/lists/{list_id}/entries/add` |
| data | Remove List Entries | POST | `/data/v1/lists/{list_id}/entries/remove` |
| data | Get List Entry | GET | `/data/v1/lists/{list_id}/entries/{entry_id}` |
| data | List Objects | GET | `/data/v1/objects` |
| data | Create Object | POST | `/data/v1/objects` |
| data | Get Object | GET | `/data/v1/objects/{object_name}` |
| data | Update Object | PATCH | `/data/v1/objects/{object_name}` |
| data | Delete Object | DELETE | `/data/v1/objects/{object_name}` |
| data | List Object Attributes | GET | `/data/v1/objects/{object_name}/attributes` |
| data | Create Object Attribute | POST | `/data/v1/objects/{object_name}/attributes` |
| data | Get Object Attribute | GET | `/data/v1/objects/{object_name}/attributes/{attribute_name}` |
| data | Update Object Attribute | PATCH | `/data/v1/objects/{object_name}/attributes/{attribute_name}` |
| data | Delete Object Attribute | DELETE | `/data/v1/objects/{object_name}/attributes/{attribute_name}` |
| data | List Object Attribute Options | GET | `/data/v1/objects/{object_name}/attributes/{attribute_name}/options` |
| data | Create Object Attribute Option | POST | `/data/v1/objects/{object_name}/attributes/{attribute_name}/options` |
| data | Get Object Attribute Option | GET | `/data/v1/objects/{object_name}/attributes/{attribute_name}/options/{option_name}` |
| data | Update Object Attribute Option | PATCH | `/data/v1/objects/{object_name}/attributes/{attribute_name}/options/{option_name}` |
| data | Delete Object Attribute Option | DELETE | `/data/v1/objects/{object_name}/attributes/{attribute_name}/options/{option_name}` |
| data | Create Object Record Query Job | POST | `/data/v1/objects/{object_name}/query-jobs` |
| data | List Object Record Query Jobs | GET | `/data/v1/objects/{object_name}/query-jobs` |
| data | Get Object Record Query Job | GET | `/data/v1/objects/{object_name}/query-jobs/{job_id}` |
| data | Cancel Object Record Query Job | POST | `/data/v1/objects/{object_name}/query-jobs/{job_id}/cancel` |
| data | Get Object Record Query Job Results | GET | `/data/v1/objects/{object_name}/query-jobs/{job_id}/results` |
| data | Create Object Record | POST | `/data/v1/objects/{object_name}/records` |
| data | Find Unique Object Record | POST | `/data/v1/objects/{object_name}/records/find-unique` |
| data | Upsert Object Record | POST | `/data/v1/objects/{object_name}/records/upsert` |
| data | Get Object Record | GET | `/data/v1/objects/{object_name}/records/{record_id}` |
| data | Update Object Record | PATCH | `/data/v1/objects/{object_name}/records/{record_id}` |
| data | Delete Object Record | DELETE | `/data/v1/objects/{object_name}/records/{record_id}` |
| sequences | Create Sequence Enrollment Step Query Job | POST | `/sequences/v1/enrollment-steps/query-jobs` |
| sequences | List Sequence Enrollment Step Query Jobs | GET | `/sequences/v1/enrollment-steps/query-jobs` |
| sequences | Get Sequence Enrollment Step Query Job | GET | `/sequences/v1/enrollment-steps/query-jobs/{job_id}` |
| sequences | Cancel Sequence Enrollment Step Query Job | POST | `/sequences/v1/enrollment-steps/query-jobs/{job_id}/cancel` |
| sequences | Get Sequence Enrollment Step Query Job Results | GET | `/sequences/v1/enrollment-steps/query-jobs/{job_id}/results` |
| sequences | Get Sequence Enrollment Step | GET | `/sequences/v1/enrollment-steps/{id}` |
| sequences | Update Sequence Enrollment Step | PATCH | `/sequences/v1/enrollment-steps/{id}` |
| sequences | Create Sequence Enrollment | POST | `/sequences/v1/enrollments` |
| sequences | List Sequence Enrollments | GET | `/sequences/v1/enrollments` |
| sequences | Create Sequence Enrollment Query Job | POST | `/sequences/v1/enrollments/query-jobs` |
| sequences | List Sequence Enrollment Query Jobs | GET | `/sequences/v1/enrollments/query-jobs` |
| sequences | Get Sequence Enrollment Query Job | GET | `/sequences/v1/enrollments/query-jobs/{job_id}` |
| sequences | Cancel Sequence Enrollment Query Job | POST | `/sequences/v1/enrollments/query-jobs/{job_id}/cancel` |
| sequences | Get Sequence Enrollment Query Job Results | GET | `/sequences/v1/enrollments/query-jobs/{job_id}/results` |
| sequences | Get Sequence Enrollment | GET | `/sequences/v1/enrollments/{id}` |
| sequences | Delete Sequence Enrollment | DELETE | `/sequences/v1/enrollments/{id}` |
| sequences | Approve Sequence Enrollment | POST | `/sequences/v1/enrollments/{id}/approve` |
| sequences | Pause Sequence Enrollment | POST | `/sequences/v1/enrollments/{id}/pause` |
| sequences | Resume Sequence Enrollment | POST | `/sequences/v1/enrollments/{id}/resume` |
| sequences | List Sequence Enrollment Steps | GET | `/sequences/v1/enrollments/{id}/steps` |
| sequences | List Sequences | GET | `/sequences/v1/sequences` |
| sequences | Retrieve Sequence | GET | `/sequences/v1/sequences/{id}` |
| sequences | Delete Sequence | DELETE | `/sequences/v1/sequences/{id}` |
| sequences | Pause Sequence | POST | `/sequences/v1/sequences/{id}/pause` |
| sequences | Resume Sequence | POST | `/sequences/v1/sequences/{id}/resume` |
| sequences | List Sequence Steps | GET | `/sequences/v1/sequences/{id}/steps` |
| sequences | Retrieve Sequence Step | GET | `/sequences/v1/sequences/{id}/steps/{step_id}` |
| tasks | List Tasks | GET | `/tasks/v1/tasks` |
| tasks | Create Task | POST | `/tasks/v1/tasks` |
| tasks | Create Task Query Job | POST | `/tasks/v1/tasks/query-jobs` |
| tasks | List Task Query Jobs | GET | `/tasks/v1/tasks/query-jobs` |
| tasks | Get Task Query Job | GET | `/tasks/v1/tasks/query-jobs/{job_id}` |
| tasks | Cancel Task Query Job | POST | `/tasks/v1/tasks/query-jobs/{job_id}/cancel` |
| tasks | Get Task Query Job Results | GET | `/tasks/v1/tasks/query-jobs/{job_id}/results` |
| tasks | Retrieve Task | GET | `/tasks/v1/tasks/{id}` |
| tasks | Update Task | PATCH | `/tasks/v1/tasks/{id}` |
| tasks | Delete Task | DELETE | `/tasks/v1/tasks/{id}` |
| tasks | Complete Task | POST | `/tasks/v1/tasks/{id}/complete` |
| analytics | Send IDentify Event | POST | `/identify` |
| analytics | Send Page Event | POST | `/page` |
| analytics | Send Track Event | POST | `/track` |
