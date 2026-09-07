"""Contract shape/examples/lineage tests. No production SLA or handover implementation."""
import copy
import hashlib
import json
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from jsonschema import Draft202012Validator, FormatChecker
from openapi_spec_validator import validate_spec

ROOT = Path(__file__).resolve().parents[2]
BASE = 'contracts/openapi/'
CONTRACT = json.loads((ROOT / (BASE + 'HIELYA_OPENAPI_MVP_LOCAL_36_V1_3.yaml')).read_text())
PROFILE = json.loads((ROOT / (BASE + 'MVP_LOCAL_36_ALCOHOL_IMPLEMENTATION_PROFILE_V1_3.json')).read_text())
FIXTURES = json.loads((ROOT / 'tests/fixtures/alcohol-contract-v1-3.json').read_text())
SCHEMAS = CONTRACT['components']['schemas']


def validate(schema, value):
    document = {'$schema': CONTRACT['jsonSchemaDialect'], '$ref': '#/components/schemas/' + schema,
                'components': CONTRACT['components']}
    return list(Draft202012Validator(document, format_checker=FormatChecker()).iter_errors(value))


def witness_errors(value):
    """Independent arithmetic checks on documented examples, not a runtime authorization port."""
    a = value['alcohol']
    snapshot = a['snapshot']
    if snapshot is None:
        return [] if a['status'] == 'UNAVAILABLE' else ['missing snapshot']
    estimate = snapshot['estimate']
    deadline = datetime.fromisoformat(snapshot['alcoholHandoverDeadlineAt'])
    cutoff = datetime.fromisoformat(snapshot['alcoholOrderCutoffAt'])
    maximum = max(45, estimate['upperBoundMinutes'])
    errors = []
    if snapshot['effectiveSlaMinutes'] != maximum:
        errors.append('maximum')
    if cutoff != deadline - timedelta(minutes=maximum):
        errors.append('cutoff')
    local = deadline.astimezone(ZoneInfo('Europe/Madrid'))
    if (local.hour, local.minute, local.second) != (22, 0, 0):
        errors.append('deadline')
    if estimate['minimumMinutes'] > estimate['upperBoundMinutes']:
        errors.append('range')
    if estimate != value['demand']['estimate']:
        errors.append('estimate mismatch')
    return errors


class AlcoholContract(unittest.TestCase):
    def test_openapi_and_every_schema_are_valid(self):
        validate_spec(CONTRACT)
        for name, schema in SCHEMAS.items():
            with self.subTest(schema=name):
                Draft202012Validator.check_schema(schema)

    def test_frozen_lineage_and_inherited_schemas(self):
        for item in PROFILE['lineage']:
            self.assertFalse(item['modified'])
            self.assertEqual(hashlib.sha256((ROOT / item['file']).read_bytes()).hexdigest(), item['sha256'])
        old = json.loads((ROOT / (BASE + 'HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml')).read_text())
        for name, schema in old['components']['schemas'].items():
            if name not in ['DeliveryQuote', 'CartValidation']:
                self.assertEqual(SCHEMAS[name], schema, name)
        for path, operations in old['paths'].items():
            if path not in ['/delivery/quote', '/carts/{cartId}/validate']:
                self.assertEqual(CONTRACT['paths'][path], operations, path)

    def test_all_examples_validate_and_arithmetic_is_consistent(self):
        for fixture in FIXTURES:
            with self.subTest(example=fixture['name']):
                self.assertEqual(validate(fixture['schema'], fixture['value']), [])
                if fixture['schema'] == 'OperationalAvailability':
                    self.assertEqual(witness_errors(fixture['value']), [])

    def test_high_demand_and_cutoff_coexist(self):
        value = FIXTURES[1]['value']
        self.assertEqual(value['storeStatus'], 'OPEN')
        self.assertEqual(value['demand']['level'], 'HIGH')
        self.assertEqual(value['alcohol']['status'], 'UNAVAILABLE')
        self.assertEqual(value['alcohol']['snapshot']['effectiveSlaMinutes'], 60)
        self.assertTrue(value['alcohol']['snapshot']['alcoholOrderCutoffAt'].endswith('21:00:00+02:00'))

    def test_fixed_cutoff_or_optimistic_sla_corrupts_high_demand_witness(self):
        for key, wrong in [('effectiveSlaMinutes', 45), ('alcoholOrderCutoffAt', '2026-09-07T21:15:00+02:00')]:
            value = copy.deepcopy(FIXTURES[1]['value'])
            value['alcohol']['snapshot'][key] = wrong
            self.assertTrue(witness_errors(value))

    def test_unknown_estimate_cannot_be_available(self):
        value = copy.deepcopy(FIXTURES[2]['value'])
        value['alcohol']['status'] = 'AVAILABLE'
        self.assertTrue(validate('OperationalAvailability', value))

    def test_closed_store_cannot_authorize_alcohol(self):
        value = copy.deepcopy(FIXTURES[0]['value'])
        value['storeStatus'] = 'CLOSED'
        self.assertTrue(validate('OperationalAvailability', value))

    def test_missing_and_invalid_fields_are_rejected(self):
        for fixture in FIXTURES:
            for field in SCHEMAS[fixture['schema']].get('required', []):
                value = copy.deepcopy(fixture['value'])
                del value[field]
                with self.subTest(example=fixture['name'], field=field):
                    self.assertTrue(validate(fixture['schema'], value))
        value = copy.deepcopy(FIXTURES[0]['value'])
        value['alcohol']['snapshot']['estimate']['validUntil'] = 'tomorrow'
        self.assertTrue(validate('OperationalAvailability', value))

    def test_unknown_identity_fields_are_rejected(self):
        for fixture in FIXTURES:
            for field in ['documentPhoto', 'documentNumber', 'dateOfBirth', 'notes']:
                value = copy.deepcopy(fixture['value'])
                value[field] = 'must not be accepted'
                self.assertTrue(validate(fixture['schema'], value))

    def test_handover_needs_pin_and_presence_not_caller_actor_or_clock(self):
        command = next(f['value'] for f in FIXTURES if f['schema'] == 'AtomicHandoverInput')
        for field, value in [('pin', '123'), ('recipientPresent', False), ('verifiedAt', '2026-09-07T19:00:00Z'), ('courierId', 'spoof')]:
            candidate = dict(command, **{field: value})
            self.assertTrue(validate('AtomicHandoverInput', candidate))
        operation = CONTRACT['paths']['/admin/deliveries/{deliveryId}/verify-pin']['post']
        self.assertIn('ATOMIC_ALL_OR_NOTHING', operation['x-hielya-domain-guards'])
        self.assertIn('AGE_18_PLUS_IF_ALCOHOL', operation['x-hielya-domain-guards'])

    def test_isolated_age_check_cannot_approve_or_reopen_delivery(self):
        for status in ['APPROVED', 'VERIFIED_18_PLUS', 'PENDING']:
            self.assertTrue(validate('RefuseAgeInput', {'expectedRevision': 1, 'status': status}))
        for status in ['REFUSED_NO_ID', 'REFUSED_MINOR', 'REFUSED_DOUBTFUL_ID']:
            self.assertEqual(validate('RefuseAgeInput', {'expectedRevision': 1, 'status': status}), [])
        self.assertFalse(any('retry' in p or 'redeliver' in p for p in CONTRACT['paths']))

    def test_order_cannot_disable_derived_age_requirement(self):
        order = copy.deepcopy(next(f['value'] for f in FIXTURES if f['schema'] == 'OrderCompliance'))
        order['requiresAgeVerification'] = False
        self.assertTrue(validate('OrderCompliance', order))
        order['containsAlcohol'] = False
        self.assertTrue(validate('OrderCompliance', order))  # alcohol snapshot is inconsistent

    def test_age_record_pending_and_verified_have_different_evidence(self):
        pending = {'status': 'PENDING', 'method': None, 'recordedAt': None, 'courierId': None}
        self.assertEqual(validate('AgeVerificationRecord', pending), [])
        pending['status'] = 'VERIFIED_18_PLUS'
        self.assertTrue(validate('AgeVerificationRecord', pending))

    def test_every_new_command_requires_role_revision_idempotency(self):
        for path, methods in CONTRACT['paths'].items():
            for method, op in methods.items():
                if not isinstance(op, dict) or op.get('x-hielya-implementation-status') != 'CONTRACT_ONLY_PHASE_1' or method != 'post':
                    continue
                self.assertTrue(op['security'], path)
                self.assertTrue(any(p['name'] == 'Idempotency-Key' and p['required'] for p in op['parameters']))
                self.assertIn('409', op['responses'])
                if '/deliveries/' in path:
                    self.assertEqual(op['security'], [{'courierBearer': []}])

    def test_retention_and_phase_boundaries(self):
        self.assertEqual(validate('RetentionPolicyV13', PROFILE['retention']), [])
        wrong = dict(PROFILE['retention'], anchor='ORDER_CREATED_AT')
        self.assertTrue(validate('RetentionPolicyV13', wrong))
        self.assertFalse(PROFILE['runtimeImplemented'])
        self.assertEqual(PROFILE['runtimeContractVersion'], '1.2.0')
        self.assertFalse(PROFILE['productionAuthorized'])


if __name__ == '__main__':
    unittest.main()
