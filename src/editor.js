import { createHigherOrderComponent } from "@wordpress/compose";
import { InspectorControls } from "@wordpress/block-editor";
import { PanelBody } from "@wordpress/components";
import {
	__experimentalHStack as HStack,
	TextControl,
	Button,
} from "@wordpress/components";
import { Icon, trash } from "@wordpress/icons";
import { addFilter } from "@wordpress/hooks";
import { useSelect } from "@wordpress/data";

function addCustomAttributes(settings) {
	if (settings.attributes) {
		settings.attributes.attributesMap = {
			type: "object",
			default: {},
		};
	}

	return settings;
}

addFilter(
	"blocks.registerBlockType",
	"attributeCommander/attribute",
	addCustomAttributes,
);

function renameObjectProperty(oldObj, oldKey, newKey) {
	if (!oldObj) {
		return oldObj;
	}

	const keys = Object.keys(oldObj);
	const newObj = keys.reduce((acc, val) => {
		if (val === oldKey) {
			acc[newKey] = oldObj[oldKey];
		} else {
			acc[val] = oldObj[val];
		}
		return acc;
	}, {});

	return newObj;
}

function removeObjectProperty(object, key) {
	return Object.keys(object).reduce((acc, val) => {
		if (val !== key) {
			acc[val] = object[val];
		}
		return acc;
	}, {});
}

const withAttributeControls = createHigherOrderComponent((BlockEdit) => {
	return (props) => {
		if (!props.isSelected) {
			return <BlockEdit {...props} />;
		}

		const isBlockLocked = useSelect((select) => {
			const { canMoveBlock, canRemoveBlock, getBlockRootClientId } =
				select("core/block-editor");
			const rootClientId = getBlockRootClientId(props.clientId);

			const canMove = canMoveBlock(props.clientId, rootClientId);
			const canRemove = canRemoveBlock(props.clientId, rootClientId);
			return !canMove || !canRemove;
		});

		if (isBlockLocked) {
			return <BlockEdit {...props} />;
		}

		return (
			<>
				<BlockEdit key="edit" {...props} />
				<InspectorControls>
					<PanelBody title="HTML Attributes">
						{Object.entries(props.attributes.attributesMap).map(
							([locator, data]) => (
								<div key={locator}>
									<HStack alignment="top">
										<TextControl
											value={locator}
											style={{
												height: "24px",
												minHeight: "24px",
											}}
											onChange={(newLocator) => {
												if (
													Object.keys(props.attributes.attributesMap).includes(
														newLocator,
													)
												) {
													return;
												}

												props.setAttributes({
													attributesMap:
														!newLocator && Object.entries(data).length === 0
															? removeObjectProperty(
																	props.attributes.attributesMap,
																	locator,
															  )
															: renameObjectProperty(
																	props.attributes.attributesMap,
																	locator,
																	newLocator,
															  ),
												});
											}}
										/>
										<Button
											variant="secondary"
											size="small"
											onClick={() => {
												props.setAttributes({
													attributesMap: {
														...props.attributes.attributesMap,
														[locator]: {
															...data,
															"new-key": "new-value",
														},
													},
												});
											}}
										>
											Add attribute
										</Button>
									</HStack>
									<div style={{ marginTop: "-24px", marginBottom: "32px" }}>
										<TextControl
											style={{
												height: "24px",
												minHeight: "24px",
											}}
											value={
												Object.entries(data)
													.map(([key, value]) => {
														if (value === null) {
															return `${key}=""`;
														}
														if (value === "") {
															return key;
														}
														return `${key}="${value}"`;
													})
													.join(" ") || ""
											}
											onChange={(newValue) => {
												let newAttributes = [];
												if (newValue) {
													newAttributes = newValue
														.match(/(?:[^\s"]+|"[^"]*")+/g)
														.map((pair) => {
															if (pair.endsWith("=")) {
																return [pair.replace("=", ""), null];
															}
															if (pair.includes("=")) {
																return pair.split("=");
															}
															return [pair, ""];
														})
														.map(([key, value]) => {
															if (value === null) {
																return [key, value];
															}
															if (!value) {
																return [key, ""];
															}
															return [key, value.replace(/"/g, "").trim()];
														});
												}
												if (newValue[newValue.length - 1] === " ") {
													newAttributes.push(["", ""]);
												}
												props.setAttributes({
													attributesMap: {
														...props.attributes.attributesMap,

														[locator]: Object.fromEntries(newAttributes),
													},
												});
											}}
										/>
									</div>
									{Object.entries(data).map(([key, value]) => (
										<div key={key} style={{ marginTop: "-24px" }}>
											<HStack alignment="top">
												<TextControl
													style={{
														height: "24px",
														minHeight: "24px",
													}}
													value={key}
													onChange={(newKey) => {
														if (Object.keys(data).includes(newKey)) {
															return;
														}

														props.setAttributes({
															attributesMap: {
																...(props.attributes.attributesMap || {}),
																[locator]:
																	!newKey && !value
																		? removeObjectProperty(data, key)
																		: renameObjectProperty(data, key, newKey),
															},
														});
													}}
												/>
												<TextControl
													style={{
														height: "24px",
														minHeight: "24px",
													}}
													value={value}
													onChange={(newValue) => {
														const newMap = {
															...(props.attributes.attributesMap || {}),
															[locator]: {
																...data,
																[key]: newValue,
															},
														};

														props.setAttributes({
															attributesMap: newMap,
														});
													}}
												/>
												<Button
													variant="tertiary"
													size="small"
													onClick={() => {
														props.setAttributes({
															attributesMap: {
																...props.attributes.attributesMap,
																[locator]: removeObjectProperty(data, key),
															},
														});
													}}
												>
													<Icon icon={trash} />
												</Button>
											</HStack>
										</div>
									))}
								</div>
							),
						)}
						<Button
							variant="secondary"
							size="small"
							onClick={() => {
								props.setAttributes({
									attributesMap: {
										...(props.attributes.attributesMap || {}),
										"new-locator": {
											"new-key": "new-value",
										},
									},
								});
							}}
						>
							Add locator
						</Button>
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
}, "withAttributeControls");

addFilter(
	"editor.BlockEdit",
	"attributeCommander/controls",
	withAttributeControls,
);
