import 'react-native';
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const hasText = (tree, text) =>
  tree.root.findAll(n => n.props && n.props.children === text).length > 0;

it('boots into the welcome screen when signed out', async () => {
  let tree;
  await act(async () => {
    tree = renderer.create(<App />);
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  expect(hasText(tree, 'wha2do')).toBe(true);
  expect(hasText(tree, 'Log in')).toBe(true);
  expect(hasText(tree, 'Create an account')).toBe(true);
  act(() => tree.unmount());
});
